// Nextjs 集中式路由的唯一数据源

export const appPaths = {
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
    index: { href: '/' },
    detail: { href: (id: string) => `/${id}` },
  },
  rag: {
    index: { href: '/rag' },
  },
  api: {
    files: {
      upload: { href: '/api/files/upload' },
    },
    history: { href: '/api/history' },
    reflection: { href: '/api/reflection' },
    rag: {
      documents: { href: '/api/rag/documents' },
      document: { href: (id: string) => `/api/rag/documents/${id}` },
      ingest: { href: (id: string) => `/api/rag/ingest/${id}` },
    },
  },
}
