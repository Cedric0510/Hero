import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Déconnexion réussie' })
  
  // Supprimer le cookie de session
  response.cookies.delete('session')
  
  return response
}