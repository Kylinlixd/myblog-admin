# 一次“偶发 500”的完整解法：从请求 ID 到幂等、事务与可控重试

线上最难处理的故障，往往不是每次都挂的大故障，而是偶尔发生、无法稳定复现、用户却能明确感知的那一类：点击提交后页面转圈，刷新发现数据已经写入；日志里有 500，但开发环境完全正常；同一个请求重放两次，数据库里出现两条业务记录。

这篇文章记录一套在实际开发中反复使用的排查路径。示例以 Django/DRF 风格的接口为主，但思路同样适用于 Node.js、Java 或 Go 服务：先建立证据，再划分边界，最后让恢复动作可控。

## 一、先把“偶发”变成可以追踪的请求

不要从“是不是数据库慢”开始猜。第一步是在请求入口生成并透传一个请求标识：

~~~python
import uuid
import time
import logging

logger = logging.getLogger(__name__)

def create_request_id(request):
    return request.headers.get("X-Request-ID") or str(uuid.uuid4())

def create_order(request):
    request_id = create_request_id(request)
    started = time.perf_counter()
    try:
        result = do_create_order(request.data)
        logger.info("order.create.success", extra={
            "request_id": request_id,
            "user_id": request.user.id,
            "elapsed_ms": round((time.perf_counter() - started) * 1000),
        })
        return result
    except Exception:
        logger.exception("order.create.failed", extra={"request_id": request_id})
        raise
~~~

前端收到错误时，把 `request_id` 展示在“稍后重试”的辅助信息里，客服或开发就能用它从网关日志一路查到应用、数据库和下游服务。这个小改动比“多打几行 print”更有价值，因为它把一次用户操作和多层日志建立了稳定关联。

<figure class="article-figure">
[[BACKEND_REQUEST_RECOVERY]]
<figcaption>图 1：一次请求失败后的恢复路径。关键不是立即重试，而是先确认请求发生在哪一层、失败是否可安全重放。</figcaption>
</figure>

## 二、把错误按“能不能重试”分类

HTTP 状态码只是线索，不是恢复策略本身。可以先建立这张判断表：

| 类型 | 常见原因 | 默认动作 |
| --- | --- | --- |
| 参数错误（400） | 字段缺失、格式不合法 | 直接提示并修正，不重试 |
| 未认证（401） | access token 过期 | 刷新一次会话，再重放原请求 |
| 权限不足（403） | 角色不允许 | 提示用户，不重试 |
| 资源冲突（409） | 唯一键冲突、版本过期 | 返回冲突信息，让用户选择 |
| 服务暂时不可用（502/503） | 下游超时、实例重启 | 仅对幂等请求有限重试 |
| 服务内部错误（500） | 未捕获异常或数据问题 | 先记录证据，不能默认无限重试 |

看到 500 就“自动再发一次”是最危险的错误之一。如果第一次请求已经写入数据库，只是响应在返回前超时，第二次重试可能制造重复订单、重复邮件或重复扣款。重试之前必须回答：这次操作是否幂等？超时发生在写入之前、写入期间，还是写入之后？

## 三、用幂等键解决“同一个请求被执行两次”

幂等的目标不是让请求永远成功，而是让同一个业务意图重复到达时，最终只产生一个确定结果。客户端在一次提交开始时生成 `Idempotency-Key`，网络重试时沿用同一个值。

~~~python
from django.db import models

class IdempotencyRecord(models.Model):
    key = models.CharField(max_length=100, unique=True)
    request_hash = models.CharField(max_length=64)
    response_body = models.JSONField(null=True)
    response_status = models.PositiveSmallIntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
~~~

服务端不要只用“先查询、再插入”的普通代码，因为并发请求可能同时查不到记录。唯一索引是最后一道防线；如果插入触发 `IntegrityError`，就重新读取已经写入的结果并返回：

~~~python
import hashlib
import json
from django.db import IntegrityError, transaction

def request_hash(data):
    raw = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode()).hexdigest()

def create_once(request):
    key = request.headers["Idempotency-Key"]
    digest = request_hash(request.data)
    try:
        with transaction.atomic():
            record = IdempotencyRecord.objects.create(key=key, request_hash=digest)
            order = Order.objects.create(
                user=request.user,
                amount=request.data["amount"],
                status="pending",
            )
            payload = {"id": order.id, "status": order.status}
            record.response_body = payload
            record.response_status = 201
            record.save(update_fields=["response_body", "response_status"])
    except IntegrityError:
        record = IdempotencyRecord.objects.get(key=key)
        if record.request_hash != digest:
            return {"detail": "同一个幂等键不能对应不同请求"}, 409
        if record.response_body is None:
            return {"detail": "请求正在处理中，请稍后查询"}, 202
        return record.response_body, record.response_status
    return payload, 201
~~~

生产代码还需要考虑“进程在数据库提交后、写回响应前崩溃”的窗口，因此记录最好有 `processing/succeeded/failed` 状态和过期清理策略。幂等键不是永久缓存：支付类操作可以保留 24 小时，普通表单只需保留几分钟。

<figure class="article-figure">
[[BACKEND_IDEMPOTENCY_TRANSACTION]]
<figcaption>图 2：幂等、事务和异步副作用分别解决不同问题，不要把三者混成一个“重试函数”。</figcaption>
</figure>

## 四、事务只包住数据库一致性，不要包住网络调用

事务适合保护同一个数据库里的多步写入，例如订单、库存和操作流水必须一起成功或一起回滚。它不适合长时间包住 HTTP、短信或邮件调用：

~~~python
from django.db import transaction

@transaction.atomic
def confirm_order(order_id, operator):
    order = (
        Order.objects.select_for_update()
        .select_related("user")
        .get(id=order_id)
    )
    if order.status == "confirmed":
        return order
    order.status = "confirmed"
    order.confirmed_by = operator
    order.save(update_fields=["status", "confirmed_by"])
    OutboxEvent.objects.create(
        event_type="order.confirmed",
        aggregate_id=order.id,
        payload={"order_id": order.id},
    )
    return order
~~~

事务提交成功后，再由 worker 消费 `OutboxEvent` 发送通知。发送失败可以重试、告警或人工重放，但不会让已经确认的订单回滚成未知状态。这就是 Outbox 思路：把“提交后要做的事”先记录成可靠数据，再异步执行副作用。

## 五、重试要有上限、退避和可观测结果

一个可接受的重试策略通常包含：只重试明确的临时错误；只重试幂等读请求或已经具备幂等键的写请求；使用指数退避加随机抖动；总次数和总耗时有上限；每次重试记录 `attempt`、`request_id` 和最终结果；达到上限后走降级或人工队列。

~~~python
import random
import time

def retry(operation, attempts=3, base_delay=0.2):
    last_error = None
    for attempt in range(attempts):
        try:
            return operation()
        except TemporaryDependencyError as exc:
            last_error = exc
            if attempt == attempts - 1:
                break
            delay = base_delay * (2 ** attempt) + random.random() * 0.1
            time.sleep(delay)
    raise last_error
~~~

“重试成功”也不能只看最终 200。需要同时观察错误率、P95/P99 延迟、下游超时比例、幂等冲突数和队列积压。如果错误率下降但延迟和队列积压飙升，说明只是把故障往后推了。

## 六、用故障回归测试把经验留下来

至少补上这些测试：同一个 `Idempotency-Key` 连续提交两次只创建一条记录；相同幂等键但请求体不同返回 409；数据库事务中途失败时主记录和流水都不落库；下游超时只触发有限重试；Outbox 消费失败后可以安全重放；日志中始终包含 `request_id`。

我更愿意把“偶发 500”当成一次边界设计检查，而不是单纯修一个异常分支。真正可靠的后端不是永远不失败，而是失败时能回答：发生了什么、是否已经写入、还能不能安全重试、下一步由谁接住。

## 发布前检查清单

- [ ] 请求入口有 request_id，日志和响应可以关联。
- [ ] 写操作明确幂等边界，数据库有唯一约束。
- [ ] 事务只保护数据库一致性。
- [ ] 网络副作用通过 Outbox 或队列异步处理。
- [ ] 重试有条件、上限、退避和指标。
- [ ] 关键失败路径有自动化回归测试。

希望下一次报警响起时，我们面对的是一张清晰的证据地图，而不是一串只能凭感觉解释的 500。
