import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const makeChoiceSchema = z.object({
  sessionId: z.number(),
  choiceId: z.number(),
  diceRoll: z.number().nullable().optional(),
  forcePage: z.number().optional(), // Pour forcer l'aller vers une page spécifique (échecs)
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
    const { sessionId, choiceId, diceRoll, forcePage } = makeChoiceSchema.parse(body)

    // Vérifier que la session appartient à l'utilisateur
    const gameSession = await prisma.gameSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id
      }
    })

    if (!gameSession) {
      return NextResponse.json(
        { error: 'Session de jeu non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer le choix sélectionné
    const choice = await prisma.storyChoice.findUnique({
      where: { id: choiceId },
      include: {
        page: true
      }
    })

    if (!choice) {
      return NextResponse.json(
        { error: 'Choix non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le choix appartient à la page actuelle
    if (choice.pageId !== gameSession.currentPageId) {
      return NextResponse.json(
        { error: 'Choix invalide pour la page actuelle' },
        { status: 400 }
      )
    }

    // Déterminer la page de destination
    let targetPageId = forcePage || choice.targetPageId

    // Si aucune page cible, l'aventure est terminée
    if (!targetPageId) {
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          isCompleted: true,
          lastPlayedAt: new Date(),
        }
      })

      return NextResponse.json({
        success: true,
        isCompleted: true,
        message: 'Aventure terminée !'
      })
    }

    // Mettre à jour la session avec la nouvelle page
    const updatedSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        currentPageId: targetPageId,
        lastPlayedAt: new Date(),
        // Ici on pourrait ajouter des effets du choix (gain/perte de vie, etc.)
      }
    })

    // Récupérer la nouvelle page pour vérifier si elle existe
    const newPage = await prisma.storyPage.findUnique({
      where: { id: targetPageId }
    })

    if (!newPage) {
      // Si la nouvelle page n'existe pas, terminer l'aventure
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { isCompleted: true }
      })

      return NextResponse.json({
        success: true,
        isCompleted: true,
        message: 'Fin de l\'aventure !'
      })
    }

    return NextResponse.json({
      success: true,
      isCompleted: false,
      session: updatedSession,
      newPage: newPage,
      diceRoll,
      message: 'Choix traité avec succès'
    })

  } catch (error) {
    console.error('Erreur lors du traitement du choix:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du choix' },
      { status: 500 }
    )
  }
}