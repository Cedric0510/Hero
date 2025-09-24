import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import GameClient from '@/components/GameClient'
import EditorPreview from '@/components/EditorPreview'

interface StoryPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StoryPage({ params, searchParams }: StoryPageProps) {
  const user = await getCurrentUser()
  const { id } = await params
  const { preview } = await searchParams
  
  if (!user) {
    redirect('/')
  }

  const isEditorPreview = preview === 'editor'

  // Récupérer l'histoire avec ses pages et choix
  const story = await prisma.story.findUnique({
    where: { 
      id: parseInt(id)
      // Note: On retire isPublished pour permettre la prévisualisation depuis l'éditeur
    },
    include: {
      pages: {
        include: {
          choices: true
        },
        orderBy: { pageNumber: 'asc' }
      }
    }
  })

  if (!story) {
    redirect('/stories')
  }

  // Si c'est une prévisualisation éditeur, utiliser le composant EditorPreview
  if (isEditorPreview) {
    return <EditorPreview story={story as any} user={user} />
  }

  // Vérifier s'il y a déjà une session de jeu pour cette histoire
  let gameSession = await prisma.gameSession.findFirst({
    where: {
      userId: user.id,
      storyId: story.id,
      isCompleted: false
    }
  })

  // Si pas de session, créer une nouvelle session
  if (!gameSession) {
    const startPage = (story as any).pages.find((p: any) => p.isStartPage) || (story as any).pages[0]
    
    if (!startPage) {
      throw new Error('Aucune page de départ trouvée')
    }

    gameSession = await prisma.gameSession.create({
      data: {
        userId: user.id,
        storyId: story.id,
        currentPageId: startPage.id,
        characterClass: 'Aventurier', // Classe par défaut
        health: 20,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        inventory: JSON.stringify([])
      }
    })
  }

  // Récupérer la page actuelle
  const currentPage = (story as any).pages.find((p: any) => p.id === gameSession.currentPageId)
  
  if (!currentPage) {
    throw new Error('Page actuelle non trouvée')
  }

  // Enrichir gameSession avec story
  const enrichedSession = {
    ...gameSession,
    story: {
      id: story.id,
      title: story.title,
      description: story.description
    }
  }

  return <GameClient gameSession={enrichedSession} currentPage={currentPage as any} user={user} />
}