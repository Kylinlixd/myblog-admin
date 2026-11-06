<template>
  <form class="comment-composer" @submit.prevent="handleSubmit">
    <div class="comment-composer__fields">
      <label class="comment-composer__field">
        <span>{{ t('component.nickname') }}</span>
        <input v-model="form.nickname" type="text" maxlength="50" :placeholder="t('component.nicknamePlaceholder')" autocomplete="nickname" />
      </label>
      <label class="comment-composer__field">
        <span>{{ t('component.email') }}</span>
        <input v-model="form.email" type="email" maxlength="254" :placeholder="t('component.emailPlaceholder')" autocomplete="email" />
      </label>
      <label class="comment-composer__field">
        <span>{{ t('component.website') }}</span>
        <input v-model="form.website" type="url" maxlength="500" :placeholder="t('component.websitePlaceholder')" autocomplete="url" />
      </label>
    </div>
    <label class="comment-composer__field comment-composer__field--content">
      <textarea v-model="form.content" rows="4" maxlength="500" :placeholder="t('component.contentPlaceholder')" :aria-label="t('component.contentLabel')" />
    </label>
    <p v-if="errorMessage" class="comment-composer__error" role="alert">{{ errorMessage }}</p>
    <div class="comment-composer__footer">
      <span>{{ t('component.identityHint') }}</span>
      <button type="submit" :disabled="loading">{{ loading ? t('component.submitting') : (submitLabel || t('component.commentSubmit')) }}</button>
    </div>
  </form>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { readCommentIdentity, saveCommentIdentity } from '@/utils/commentIdentity'
import { t } from '@/i18n'

const props = defineProps({
  loading: { type: Boolean, default: false },
  submitLabel: { type: String, default: '' },
  resetKey: { type: [String, Number], default: 0 }
})
const emit = defineEmits(['submit'])
const form = reactive({ nickname: '', email: '', website: '', content: '' })
const errorMessage = ref('')

onMounted(() => {
  // 回填上次的身份信息，回访者不必重复输入
  const identity = readCommentIdentity()
  form.nickname = identity.nickname || ''
  form.email = identity.email || ''
  form.website = identity.website || ''
})

watch(() => props.resetKey, () => {
  form.content = ''
  errorMessage.value = ''
})

const handleSubmit = () => {
  const content = form.content.trim()
  if (!content) {
    errorMessage.value = t('component.pleaseEnterContent')
    return
  }
  errorMessage.value = ''
  saveCommentIdentity(form)
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
