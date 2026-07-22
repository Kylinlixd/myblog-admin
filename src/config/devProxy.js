export function shouldBypassBlogProxy(acceptHeader = '') {
  return acceptHeader.toLowerCase().includes('text/html')
}
