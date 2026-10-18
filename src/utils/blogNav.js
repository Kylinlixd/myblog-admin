// 导航归属：URL 前缀只能描述“列表页”，共享的文章详情、标签页需要用 route name +
// 来源参数来判断。规则集中在这里，导航高亮和测试都只依赖它。
const NAV_BY_ROUTE_NAME = {
  BlogHome: 'home',
  BlogDynamic: 'book',
  BlogDynamicDetail: 'book',
  BlogTagDetail: 'book',
  BlogCategories: 'light',
  BlogCategoryDetail: 'light',
  BlogCollectionDetail: 'light',
  BlogAbout: 'about'
}

// 拾光里的文章、标签会带 ?from=light，让阅读过程中导航仍停在拾光；
// 直接打开/分享的链接没有该参数，回退到内容归属（书遇）。
export const NAV_FROM_LIGHT = 'light'

export function resolveBlogNav(route) {
  const name = route?.name
  if (!name || name === 'BlogSearch') return null

  const base = NAV_BY_ROUTE_NAME[name] ?? null
  const from = Array.isArray(route?.query?.from) ? route.query.from[0] : route?.query?.from
  if (from === NAV_FROM_LIGHT && (name === 'BlogDynamicDetail' || name === 'BlogTagDetail')) {
    return 'light'
  }
  return base
}
