import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStoryStatusSchema = z.object({
  isPublished: z.boolean()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { storyId } = await params
    const body = await request.json()
    const { isPublished } = updateStoryStatusSchema.parse(body)

    // Vérifier que l'histoire existe
    const story = await prisma.story.findUnique({
      where: { id: parseInt(storyId) }
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Histoire non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour le statut
    const updatedStory = await prisma.story.update({
      where: { id: parseInt(storyId) },
      data: { isPublished }
    })

    return NextResponse.json({
      success: true,
      isPublished: updatedStory.isPublished,
      message: isPublished ? 'Histoire marquée comme terminée' : 'Histoire marquée comme en cours'
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    )
  }
}