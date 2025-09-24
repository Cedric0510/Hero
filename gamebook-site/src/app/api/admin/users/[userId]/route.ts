import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { canManageUsers, UserRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !canManageUsers(currentUser.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { role } = await request.json()
    const resolvedParams = await params
    const userId = parseInt(resolvedParams.userId)

    // Vérifier que le rôle est valide
    if (!['ADMIN', 'AUTHOR', 'PLAYER'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    // Empêcher un admin de se retirer ses propres droits admin
    if (currentUser.id === userId && currentUser.role === 'ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Vous ne pouvez pas retirer vos propres droits administrateur' 
      }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as UserRole } as any,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      } as any
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}