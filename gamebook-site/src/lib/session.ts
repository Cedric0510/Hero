import { cookies } from 'next/headers'
import { prisma } from './prisma'

export async function getCurrentUser() {
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
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      }
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}