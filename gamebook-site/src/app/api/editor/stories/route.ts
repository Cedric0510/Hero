import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer toutes les histoires avec leurs stats
    const stories = await prisma.story.findMany({
      include: {
        _count: {
          select: {
            pages: true,
            gameSessions: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(stories)
  } catch (error) {
    console.error('Erreur lors de la récupération des histoires:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}