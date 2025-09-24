import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCharacterSchema = z.object({
  sessionId: z.number(),
  characterClass: z.string(),
})

const CHARACTER_BONUSES = {
  'Guerrier': { health: 5, strength: 3, dexterity: 0, intelligence: -1 },
  'Mage': { health: -2, strength: -1, dexterity: 1, intelligence: 4 },
  'Voleur': { health: 0, strength: 0, dexterity: 4, intelligence: 1 },
  'Prêtre': { health: 3, strength: 1, dexterity: 1, intelligence: 2 },
} as const

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
    const { sessionId, characterClass } = createCharacterSchema.parse(body)

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

    // Vérifier que la classe est valide
    if (!(characterClass in CHARACTER_BONUSES)) {
      return NextResponse.json(
        { error: 'Classe de personnage invalide' },
        { status: 400 }
      )
    }

    const bonuses = CHARACTER_BONUSES[characterClass as keyof typeof CHARACTER_BONUSES]
    
    // Mettre à jour la session avec les statistiques du personnage
    const updatedSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        characterClass,
        health: 20 + bonuses.health,
        strength: 10 + bonuses.strength,
        dexterity: 10 + bonuses.dexterity,
        intelligence: 10 + bonuses.intelligence,
      }
    })

    return NextResponse.json({ 
      success: true,
      session: updatedSession,
      message: 'Personnage créé avec succès' 
    })

  } catch (error) {
    console.error('Erreur lors de la création du personnage:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du personnage' },
      { status: 500 }
    )
  }
}