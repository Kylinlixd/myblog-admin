import { defineStore } from 'pinia'

export const useCommentStore = defineStore('comment', {
  state: () => ({
    comments: [],
    loading: true
  }),
  actions: {
    setComments(comments) {
      this.comments = comments
    },
    setLoading(loading) {
      this.loading = loading
    }
  }
}) 