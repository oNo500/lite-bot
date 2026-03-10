import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectUrl = searchParams.get('redirectUrl') ?? '/'

  const session = await auth.api.getSession({ headers: request.headers })

  if (session) {
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  const signInResponse = await auth.api.signInAnonymous({ headers: request.headers, asResponse: true })

  const redirect = NextResponse.redirect(new URL(redirectUrl, request.url))

  // 把 signInAnonymous 写入的 Set-Cookie 带到 redirect response，否则浏览器不会保存 session
  for (const cookie of signInResponse.headers.getSetCookie()) {
    redirect.headers.append('Set-Cookie', cookie)
  }

  return redirect
}
