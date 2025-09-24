import { getCurrentUser } from '@/lib/session'
import { canCreateStories } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EditorClient from '@/components/EditorClient'

export default async function EditorPage() {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || !canCreateStories(currentUser.role)) {
    redirect('/')
  }

  return <EditorClient currentUser={currentUser} />
