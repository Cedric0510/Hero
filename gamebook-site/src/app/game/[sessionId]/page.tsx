import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import GameClient from '@/components/GameClient'

interface PageProps {
  params: Promise<{ sessionId: string }>
}

export default async function GamePage({ params }: PageProps) {
  const user = await getCurrentUser()
  const { sessionId } = await params
  
  if (!user) {
    redirect('/')
  }

  // Récupérer la session de jeu avec toutes les données nécessaires
  const gameSession = await prisma.gameSession.findFirst({
    where: {
      id: parseInt(sessionId),
      userId: user.id
    },
    include: {
      story: {
        select: {
          id: true,
          title: true,
          description: true
        }
      }
    }
  })

  if (!gameSession) {
    redirect('/game-menu')
  }

  // Si le personnage n'a pas été créé, rediriger vers la création
  if (!gameSession.characterClass) {
    redirect(`/game/${sessionId}/character-creation`)
  }

  // Récupérer la page actuelle avec ses choix
  const currentPage = await prisma.storyPage.findUnique({
    where: { id: gameSession.currentPageId },
    include: {
      choices: true
    }
  })

  if (!currentPage) {
    // Problème avec la page, rediriger vers le menu
    redirect('/game-menu')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <GameClient 
        gameSession={gameSession}
        currentPage={currentPage as any}
        user={user}
      />
    </div>
  )
}