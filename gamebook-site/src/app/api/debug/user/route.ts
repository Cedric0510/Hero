import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      hasRole: !!user.role,
      roleType: typeof user.role,
    })
  } catch (error) {
    console.error('Erreur debug:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}