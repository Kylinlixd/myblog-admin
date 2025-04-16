const CACHE_NAME = 'myblog-cache-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/logo.png',
  '/assets/favicon.ico'
]

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// 激活 Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// 拦截请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果找到缓存，返回缓存
        if (response) {
          return response
        }

        // 否则发起网络请求
        return fetch(event.request).then(
          response => {
            // 检查是否是有效的响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // 克隆响应
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache)
              })

            return response
          }
        )
      })
  )
}) 