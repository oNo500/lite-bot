export class ChatError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ChatError'
    this.status = status
  }

  toResponse(): Response {
    return new Response(this.message, { status: this.status })
  }
}
