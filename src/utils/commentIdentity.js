// 评论者身份的本地记忆：评论器提交时保存，回访时回填，
// 内联回复也从这里取身份，避免回复永远以「匿名用户」提交。
const STORAGE_KEY = 'comment_identity'

export function readCommentIdentity() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

export function saveCommentIdentity(identity = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nickname: String(identity.nickname || '').slice(0, 50),
      email: String(identity.email || '').slice(0, 254),
      website: String(identity.website || '').slice(0, 500)
    }))
  } catch {
    // 隐私模式等场景下写不进去就算了，不影响提交
  }
}
