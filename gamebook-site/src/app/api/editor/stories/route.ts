import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { canCreateStories } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !canCreateStories((user as any).role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
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