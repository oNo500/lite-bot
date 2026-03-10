import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectUrl = searchParams.get('redirectUrl') || '/'

  const session = await auth.api.getSession({ headers: request.headers })

  if (session) {
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  await auth.api.signInAnonymous({ headers: request.headers })

  return NextResponse.redirect(new URL(redirectUrl, request.url))
}
