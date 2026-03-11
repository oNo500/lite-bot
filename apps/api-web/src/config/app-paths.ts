// Nextjs 集中式路由的唯一数据源

export const appPaths = {
  home: {
    href: '/',
  },
  auth: {
    signup: {
      getHref: (redirectTo?: string | null) =>
        `/signup${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    login: {
      getHref: (redirectTo?: string | null) =>
        `/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    guest: {
      getHref: (redirectUrl?: string | null) =>
        `/api/auth/guest${redirectUrl ? `?redirectUrl=${encodeURIComponent(redirectUrl)}` : ''}`,
    },
  },
  legal: {
    terms: { href: '/terms' },
    privacy: { href: '/privacy' },
  },
  chat: {
    index: { href: '/chat' },
    detail: { href: (id: string) => `/chat/${id}` },
  },
  api: {
    files: {
      upload: { href: '/api/files/upload' },
    },
  },
}
