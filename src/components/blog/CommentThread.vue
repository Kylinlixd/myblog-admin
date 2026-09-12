<template>
  <article class="comment-thread" :class="{ 'comment-thread--reply': depth > 0 }">
    <div class="comment-user">
      <UserAvatar :src="comment.avatar" :nickname="comment.nickname || '匿名用户'" :size="depth ? 28 : 36" tone="warm" fallback="anonymous" :fallback-seed="comment.id" />
      <span class="nickname">{{ comment.nickname || '匿名用户' }}</span>
      <a v-if="comment.website" class="comment-website" :href="comment.website" target="_blank" rel="noopener noreferrer">主页</a>
      <span v-if="comment.reply_to_nickname" class="reply-target">回复 @{{ comment.reply_to_nickname }}</span>
      <span class="time">{{ formatDate(comment.createTime) }}</span>
    </div>
    <div class="comment-content">{{ comment.content }}</div>
    <button class="comment-reply" type="button" @click="$emit('reply', comment)">回复</button>
    <div v-if="depth === 0 && comment.replies_preview?.length" class="comment-replies">
      <CommentThread v-for="reply in comment.replies_preview" :key="reply.id" :comment="reply" :depth="1" @reply="$emit('reply', $event)" />
      <button v-if="comment.reply_count > comment.replies_preview.length" class="comment-more" type="button" @click="$emit('more', comment)">
        查看更多回复（{{ comment.reply_count - comment.replies_preview.length }}）
      </button>
    </div>
  </article>
</template>

<script setup>
import UserAvatar from '@/components/common/UserAvatar.vue'
import dayjs from 'dayjs'

defineOptions({ name: 'CommentThread' })
defineProps({
  comment: { type: Object, required: true },
  depth: { type: Number, default: 0 }
})
defineEmits(['reply', 'more'])
const formatDate = (value) => dayjs(value).format('YYYY-MM-DD HH:mm')
</script>

<style scoped>
.comment-thread { position: relative; padding: 16px 0 18px; border-bottom: 1px solid #eee8df; }
.comment-thread--reply { padding: 10px 0 12px; border-bottom: 0; }
.comment-user { display: flex; align-items: center; min-width: 0; gap: 8px; }
.nickname { color: #40382f; font-size: 14px; font-weight: 650; }
.comment-website { color: #9b6b3e; font-size: 12px; text-decoration: none; }
.comment-website:hover { color: #2a7180; }
.reply-target, .time { color: #9c938a; font-size: 12px; }
.time { margin-left: auto; }
.comment-content { margin: 8px 0 7px 44px; color: var(--blog-comment-text); font-size: 14px; line-height: 1.7; overflow-wrap: anywhere; }
.comment-thread--reply .comment-content { margin-left: 36px; }
.comment-reply, .comment-more { margin-left: 44px; padding: 0; border: 0; background: transparent; color: #9b6b3e; cursor: pointer; font-size: 12px; }
.comment-thread--reply .comment-reply { margin-left: 36px; }
.comment-reply:hover, .comment-more:hover { color: #2a7180; }
.comment-replies { margin: 8px 0 0 44px; padding-left: 16px; border-left: 1px solid #e5ddd3; }
.comment-more { display: block; margin-top: 8px; }
@media (max-width: 600px) {
  .comment-content, .comment-reply { margin-left: 36px; }
  .comment-replies { margin-left: 36px; padding-left: 10px; }
  .time { font-size: 11px; }
}
</style>
