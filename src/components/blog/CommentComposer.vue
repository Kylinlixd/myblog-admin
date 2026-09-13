<template>
  <form class="comment-composer" @submit.prevent="handleSubmit">
    <div class="comment-composer__fields">
      <label class="comment-composer__field">
        <span>昵称：</span>
        <input v-model="form.nickname" type="text" maxlength="50" placeholder="怎么称呼你" autocomplete="nickname" />
      </label>
      <label class="comment-composer__field">
        <span>邮箱：</span>
        <input v-model="form.email" type="email" maxlength="254" placeholder="用于接收回复" autocomplete="email" />
      </label>
      <label class="comment-composer__field">
        <span>网址：</span>
        <input v-model="form.website" type="url" maxlength="500" placeholder="你的主页地址" autocomplete="url" />
      </label>
    </div>
    <label class="comment-composer__field comment-composer__field--content">
      <textarea v-model="form.content" rows="4" maxlength="500" placeholder="欢迎评论" aria-label="评论内容" />
    </label>
    <p v-if="errorMessage" class="comment-composer__error" role="alert">{{ errorMessage }}</p>
    <div class="comment-composer__footer">
      <span>信息仅用于展示评论，均可留空</span>
      <button type="submit" :disabled="loading">{{ loading ? '提交中…' : submitLabel }}</button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  loading: { type: Boolean, default: false },
  submitLabel: { type: String, default: '发表评论' },
  resetKey: { type: [String, Number], default: 0 }
})
const emit = defineEmits(['submit'])
const form = reactive({ nickname: '', email: '', website: '', content: '' })
const errorMessage = ref('')

watch(() => props.resetKey, () => {
  form.nickname = ''
  form.email = ''
  form.website = ''
  form.content = ''
  errorMessage.value = ''
})

const handleSubmit = () => {
  const content = form.content.trim()
  if (!content) {
    errorMessage.value = '请输入评论内容'
    return
  }
  errorMessage.value = ''
  emit('submit', { ...form, content })
}
</script>

<style scoped>
.comment-composer { display: grid; gap: 0; overflow: hidden; border: 1px solid #e5dbcf; border-radius: 18px; background: #fffdf9; }
.comment-composer__fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; min-height: 42px; margin: 0; padding: 0; align-items: stretch; overflow: hidden; border-radius: 17px 17px 0 0; border-bottom: 1px dashed #e5dbcf; }
.comment-composer__field { display: flex; min-width: 0; align-items: center; gap: 10px; color: #5d554e; font-size: 13px; font-weight: 650; }
.comment-composer__fields > .comment-composer__field { margin: 0; padding: 0 18px; }
.comment-composer__fields > .comment-composer__field:not(:last-child) { border-right: 1px solid #e5dbcf; }
.comment-composer__field > span { flex: 0 0 auto; }
.comment-composer input, .comment-composer textarea { width: 100%; min-width: 0; box-sizing: border-box; border: 0; border-radius: 0; background: transparent; color: #40382f; font: inherit; font-weight: 450; outline: 0; transition: background .2s ease; }
.comment-composer input { height: 42px; margin: 0; padding: 0; }
.comment-composer textarea { min-height: 190px; resize: vertical; padding: 18px; border: 0; border-radius: 0; background: transparent; line-height: 1.7; }
.comment-composer input::placeholder, .comment-composer textarea::placeholder { color: #b5aaa0; }
.comment-composer input:focus { background: #fff; }
.comment-composer textarea:focus { background: #fff; }
.comment-composer__field--content { display: block; }
.comment-composer__error { margin: 0 18px 8px; color: #b14f3f; font-size: 12px; }
.comment-composer__footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 18px 14px; color: #a1978d; font-size: 11px; }
.comment-composer__footer button { border: 0; border-radius: 999px; padding: 10px 18px; background: #b96f3d; color: #fffaf3; cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; transition: background .2s ease, transform .2s ease; }
.comment-composer__footer button:hover:not(:disabled) { background: #a96136; transform: translateY(-1px); }
.comment-composer__footer button:disabled { cursor: wait; opacity: .65; }
@media (max-width: 680px) { .comment-composer__fields { grid-template-columns: 1fr; gap: 0; padding: 0 18px; } .comment-composer__fields > .comment-composer__field { padding: 0; } .comment-composer__fields > .comment-composer__field:not(:last-child) { border-right: 0; } .comment-composer__footer { align-items: flex-end; flex-direction: column; } }
</style>
