import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateChoiceSchema = z.object({
  text: z.string().min(1, 'Le texte du choix est obligatoire'),
  targetPageId: z.number().nullable().optional(),
  diceRequired: z.number().nullable().optional(),
  diceTarget: z.number().nullable().optional(),
  statsRequired: z.string().nullable().optional(),
  failureType: z.string().nullable().optional(),
  failureDamage: z.number().nullable().optional(),
  failurePageId: z.number().nullable().optional(),
  allowRetry: z.boolean().optional(),
  retryText: z.string().nullable().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ choiceId: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { choiceId } = await params
    const body = await request.json()
    const choiceData = updateChoiceSchema.parse(body)

    // Vérifier que le choix existe
    const existingChoice = await prisma.storyChoice.findUnique({
      where: { id: parseInt(choiceId) }
    })

    if (!existingChoice) {
      return NextResponse.json(
        { error: 'Choix non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le choix
    const updatedChoice = await prisma.storyChoice.update({
      where: { id: parseInt(choiceId) },
      data: choiceData as any
    })

    return NextResponse.json({
      success: true,
      choice: updatedChoice,
      message: 'Choix mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du choix:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du choix' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ choiceId: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { choiceId } = await params

    // Vérifier que le choix existe
    const existingChoice = await prisma.storyChoice.findUnique({
      where: { id: parseInt(choiceId) }
    })

    if (!existingChoice) {
      return NextResponse.json(
        { error: 'Choix non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le choix
    await prisma.storyChoice.delete({
      where: { id: parseInt(choiceId) }
    })

    return NextResponse.json({
      success: true,
      message: 'Choix supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la suppression du choix:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du choix' },
      { status: 500 }
    )
  }
}