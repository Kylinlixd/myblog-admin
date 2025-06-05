<template>
  <div class="comment-container">
    <h3>评论</h3>
    <div v-if="loading" class="loading-state">
      <a-skeleton :active="true" :paragraph="{ rows: 2 }" :title="true" :loading="true" />
    </div>
    <div v-else-if="comments.length === 0" class="no-comments">
      <p>暂无评论</p>
    </div>
    <div v-else class="comment-list">
      <div v-for="(comment, index) in comments" :key="index" class="comment-item">
        <p class="comment-content">{{ comment.content }}</p>
        <p class="comment-author">作者: {{ comment.author }}</p>
        <div class="comment-actions">
          <a-button type="link" @click="replyToComment(comment)">回复</a-button>
          <a-button type="link" @click="addEmoji(comment)">添加表情</a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Skeleton, Button } from 'ant-design-vue'

interface Comment {
  content: string
  author: string
}

const comments = ref<Comment[]>([])
const loading = ref<boolean>(true)

onMounted(async () => {
  // 模拟加载评论数据
  setTimeout(() => {
    comments.value = [
      { content: '这是一条评论', author: '用户1' },
      { content: '这是另一条评论', author: '用户2' }
    ]
    loading.value = false
  }, 1000)
})

const replyToComment = (comment: Comment) => {
  console.log('回复评论:', comment)
}

const addEmoji = (comment: Comment) => {
  console.log('添加表情到评论:', comment)
}
</script>

<style scoped>
.comment-container {
  margin-top: 2rem;
}
.loading-state {
  margin-top: 1rem;
}
.no-comments {
  text-align: center;
  color: #888;
}
.comment-list {
  margin-top: 1rem;
}
.comment-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}
.comment-content {
  font-size: 1rem;
}
.comment-author {
  font-size: 0.9rem;
  color: #888;
}
.comment-actions {
  margin-top: 0.5rem;
}
</style> 