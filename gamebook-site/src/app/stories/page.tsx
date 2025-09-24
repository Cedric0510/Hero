import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import StoriesClient from '@/components/StoriesClient'

export default async function StoriesPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/')
  }

  // Récupérer toutes les histoires publiées
  const stories = await prisma.story.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          gameSessions: true
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            📚 Sélectionnez votre aventure
          </h1>
          <p className="text-blue-200">
            Choisissez l'histoire que vous souhaitez vivre
          </p>
        </div>

        <StoriesClient stories={stories} user={user} />
      </div>
    </div>
  )
}