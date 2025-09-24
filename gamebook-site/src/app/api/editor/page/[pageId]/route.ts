import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePageSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Le contenu de la page est obligatoire'),
  imageUrl: z.string().nullable().optional(),
  isStartPage: z.boolean().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { pageId } = await params
    const body = await request.json()
    const pageData = updatePageSchema.parse(body)

    // Vérifier que la page existe
    const existingPage = await prisma.storyPage.findUnique({
      where: { id: parseInt(pageId) },
      include: { story: true }
    })

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour la page
    const updatedPage = await prisma.storyPage.update({
      where: { id: parseInt(pageId) },
      data: pageData
    })

    return NextResponse.json({
      success: true,
      page: updatedPage,
      message: 'Page mise à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la page:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la page' },
      { status: 500 }
    )
  }
}