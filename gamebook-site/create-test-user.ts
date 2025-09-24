import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  console.log('🧪 Création des utilisateurs de test...')

  // Supprimer les utilisateurs test s'ils existent déjà
  await prisma.user.deleteMany({
    where: { 
      email: { 
        in: ['test@example.com', 'admin@example.com', 'author@example.com'] 
      } 
    }
  })

  const hashedPassword = await bcrypt.hash('123456', 12)
  
  // Créer un utilisateur administrateur
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    } as any
  })

  // Créer un utilisateur auteur
  const author = await prisma.user.create({
    data: {
      email: 'author@example.com',
      username: 'author',
      password: hashedPassword,
      role: 'AUTHOR',
    } as any
  })

  // Créer un utilisateur joueur
  const player = await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      role: 'PLAYER',
    } as any
  })

  console.log('✅ Utilisateurs de test créés !')
  console.log(`� Admin - Email: admin@example.com | Mot de passe: 123456 | ID: ${admin.id}`)
  console.log(`✏️ Auteur - Email: author@example.com | Mot de passe: 123456 | ID: ${author.id}`)
  console.log(`🎮 Joueur - Email: test@example.com | Mot de passe: 123456 | ID: ${player.id}`)
}

createTestUser()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })