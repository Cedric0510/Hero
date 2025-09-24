import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { User } from './auth'

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return null
    }

    const session = JSON.parse(sessionCookie.value)
    
    if (!session.userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: (user as any).role,
      createdAt: user.createdAt
    } as User
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}