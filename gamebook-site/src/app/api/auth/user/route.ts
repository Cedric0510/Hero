import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}