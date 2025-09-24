import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { canManageUsers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !canManageUsers(currentUser.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            gameSessions: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}