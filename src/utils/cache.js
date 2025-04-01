// 缓存配置
const CACHE_CONFIG = {
  // 默认缓存时间（毫秒）
  defaultTTL: 5 * 60 * 1000,
  // 最大缓存条目数
  maxItems: 100
}

class Cache {
  constructor() {
    this.cache = new Map()
  }
  
  // 设置缓存
  set(key, value, ttl = CACHE_CONFIG.defaultTTL) {
    // 如果缓存已满，删除最早的条目
    if (this.cache.size >= CACHE_CONFIG.maxItems) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    const entry = {
      value,
      timestamp: Date.now(),
      ttl
    }
    
    this.cache.set(key, entry)
  }
  
  // 获取缓存
  get(key) {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.value
  }
  
  // 删除缓存
  delete(key) {
    this.cache.delete(key)
  }
  
  // 清空缓存
  clear() {
    this.cache.clear()
  }
  
  // 获取缓存大小
  size() {
    return this.cache.size
  }
  
  // 检查键是否存在
  has(key) {
    return this.cache.has(key)
  }
}

// 创建缓存实例
const cache = new Cache()

export default cache 