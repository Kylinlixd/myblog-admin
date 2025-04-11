const fetchData = async () => {
  try {
    const [postsRes, categoriesRes] = await Promise.all([
      getRecentPosts(),
      getCategoryList()
    ])
    
    if (postsRes.code === 200) {
      recentPosts.value = postsRes.data
    }
    
    if (categoriesRes.code === 200) {
      categoryList.value = categoriesRes.data
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败，请稍后重试')
  }
} 