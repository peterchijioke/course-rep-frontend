import { Suspense } from 'react'
import { ChatView } from '@/components/dashboard/chat-view'

export default function DirectMessagesPage() {
  return (
    <Suspense fallback={null}>
      <ChatView direct={true} />
    </Suspense>
  )
}

