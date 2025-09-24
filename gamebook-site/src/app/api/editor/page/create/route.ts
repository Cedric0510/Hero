import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPageSchema = z.object({
  storyId: z.number(),
  pageNumber: z.number(),
  title: z.string().optional(),
  content: z.string().min(1, 'Le contenu est obligatoire'),
  isStartPage: z.boolean().optional(),
  imageUrl: z.string().nullable().optional()
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
    const { storyId, pageNumber, title, content, isStartPage, imageUrl } = createPageSchema.parse(body)

    // Vérifier que l'histoire existe (pour plus tard: vérifier aussi les permissions)
    const story = await prisma.story.findUnique({
      where: { id: storyId }
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Histoire non trouvée' },
        { status: 404 }
      )
    }

    // Si cette page doit être la page de départ, désactiver les autres
    if (isStartPage) {
      await prisma.storyPage.updateMany({
        where: { 
          storyId: storyId,
          isStartPage: true 
        },
        data: { isStartPage: false }
      })
    }

    // Créer la page
    const page = await prisma.storyPage.create({
      data: {
        storyId,
        pageNumber,
        title: title || null,
        content,
        isStartPage: isStartPage || false,
        imageUrl: imageUrl || null
      }
    })

    return NextResponse.json({
      success: true,
      pageId: page.id,
      message: 'Page créée avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la création de la page:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de la page' },
      { status: 500 }
    )
  }
}