import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { canCreateStories } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createStorySchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire'),
  description: z.string().optional(),
  authorName: z.string().min(1, 'Le nom d\'auteur est obligatoire')
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !canCreateStories((user as any).role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, authorName } = createStorySchema.parse(body)

    // Créer l'histoire
    const story = await prisma.story.create({
      data: {
        title,
        description: description || null,
        authorName,
        isPublished: false // Brouillon par défaut
      }
    })

    // Créer automatiquement une page de départ
    const startPage = await prisma.storyPage.create({
      data: {
        storyId: story.id,
        pageNumber: 1,
        title: 'Le commencement',
        content: 'Votre aventure commence ici...\n\nModifiez ce texte pour raconter le début de votre histoire.',
        isStartPage: true
      }
    })

    return NextResponse.json({
      success: true,
      storyId: story.id,
      startPageId: startPage.id,
      message: 'Histoire créée avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la création de l\'histoire:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'histoire' },
      { status: 500 }
    )
  }
}