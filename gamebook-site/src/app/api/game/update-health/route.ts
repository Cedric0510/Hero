import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const updateHealthSchema = z.object({
  sessionId: z.number(),
  damage: z.number()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, damage } = updateHealthSchema.parse(body)

    // Trouver la session de jeu
    const gameSession = await prisma.gameSession.findUnique({
      where: { id: sessionId }
    })

    if (!gameSession) {
      return NextResponse.json({ error: 'Session de jeu non trouvée' }, { status: 404 })
    }

    // Calculer les nouveaux points de vie
    const newHealth = Math.max(0, gameSession.health - damage)

    // Mettre à jour les points de vie
    const updatedSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: { 
        health: newHealth,
        lastPlayedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      newHealth: updatedSession.health,
      isGameOver: updatedSession.health <= 0
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des PV:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des points de vie' },
      { status: 500 }
    )
  }
}