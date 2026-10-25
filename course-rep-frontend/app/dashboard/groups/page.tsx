import { Suspense } from 'react'
import { ChatView } from '@/components/dashboard/chat-view'

export default function StudentGroupsPage() {
  return (
    <Suspense fallback={null}>
      <ChatView direct={false} />
    </Suspense>
  )
}

