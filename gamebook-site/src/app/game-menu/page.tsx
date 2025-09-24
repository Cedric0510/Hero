import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import GameMenuClient from '@/components/GameMenuClient'

export default async function GameMenuPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/')
  }

  // Récupérer les sessions de jeu de l'utilisateur
  const gameSessions = await prisma.gameSession.findMany({
    where: { userId: user.id },
    include: {
      story: {
        select: {
          id: true,
          title: true,
          description: true,
        }
      }
    },
    orderBy: { lastPlayedAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Bienvenue, {user.username} !
          </h1>
          <p className="text-blue-200">
            Que souhaitez-vous faire aujourd'hui ?
          </p>
        </div>

        <GameMenuClient 
          user={user} 
          gameSessions={gameSessions} 
        />
      </div>
    </div>
  )
}