import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import CharacterCreationClient from '@/components/CharacterCreationClient'

interface PageProps {
  params: Promise<{ sessionId: string }>
}

export default async function CharacterCreationPage({ params }: PageProps) {
  const user = await getCurrentUser()
  const { sessionId } = await params
  
  if (!user) {
    redirect('/')
  }

  // Vérifier que la session appartient bien à l'utilisateur
  const gameSession = await prisma.gameSession.findFirst({
    where: {
      id: parseInt(sessionId),
      userId: user.id
    },
    include: {
      story: {
        select: {
          title: true,
          description: true
        }
      }
    }
  })

  if (!gameSession) {
    redirect('/game-menu')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ⚔️ Création de Personnage
          </h1>
          <p className="text-blue-200">
            Préparez-vous pour : <span className="font-semibold">{gameSession.story.title}</span>
          </p>
        </div>

        <CharacterCreationClient 
          sessionId={parseInt(sessionId)}
          story={gameSession.story}
        />
      </div>
    </div>
  )
}