import { ChatPage } from '@/features/chat/chat-page'
import { AppSidebar } from '@/features/chat/components/app-sidebar'

export default function Page() {
  return <ChatPage sidebar={<AppSidebar />} />
}
