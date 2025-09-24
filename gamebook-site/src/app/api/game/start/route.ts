import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const startGameSchema = z.object({
  storyId: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { storyId } = startGameSchema.parse(body)

    // Vérifier que l'histoire existe et est publiée
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        isPublished: true
      },
      include: {
        pages: {
          where: { isStartPage: true },
          take: 1
        }
      }
    })

    if (!story || !story.pages[0]) {
      return NextResponse.json(
        { error: 'Histoire non trouvée ou non disponible' },
        { status: 404 }
      )
    }

    // Créer une nouvelle session de jeu
    const gameSession = await prisma.gameSession.create({
      data: {
        userId: user.id,
        storyId: storyId,
        currentPageId: story.pages[0].id,
        health: 20,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
      }
    })

    return NextResponse.json({ 
      sessionId: gameSession.id,
      message: 'Partie créée avec succès' 
    })

  } catch (error) {
    console.error('Erreur lors du démarrage de la partie:', error)
    return NextResponse.json(
      { error: 'Erreur lors du démarrage de la partie' },
      { status: 500 }
    )
  }
}