import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createChoiceSchema = z.object({
  pageId: z.number(),
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
    const choiceData = createChoiceSchema.parse(body)

    // Vérifier que la page existe
    const page = await prisma.storyPage.findUnique({
      where: { id: choiceData.pageId }
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page non trouvée' },
        { status: 404 }
      )
    }

    // Créer le choix
    const choice = await prisma.storyChoice.create({
      data: {
        pageId: choiceData.pageId,
        text: choiceData.text,
        targetPageId: choiceData.targetPageId,
        diceRequired: choiceData.diceRequired,
        diceTarget: choiceData.diceTarget,
        statsRequired: choiceData.statsRequired,
        failureType: choiceData.failureType,
        failureDamage: choiceData.failureDamage,
        failurePageId: choiceData.failurePageId,
        allowRetry: choiceData.allowRetry || false,
        retryText: choiceData.retryText
      } as any
    })

    return NextResponse.json({
      success: true,
      choiceId: choice.id,
      message: 'Choix créé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la création du choix:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du choix' },
      { status: 500 }
    )
  }
}