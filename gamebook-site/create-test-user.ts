import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  console.log('🧪 Création d\'un utilisateur de test...')

  // Supprimer l'utilisateur test s'il existe déjà
  await prisma.user.deleteMany({
    where: { email: 'test@example.com' }
  })

  // Créer un nouvel utilisateur de test
  const hashedPassword = await bcrypt.hash('123456', 12)
  
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
    }
  })

  console.log('✅ Utilisateur de test créé !')
  console.log(`📧 Email: test@example.com`)
  console.log(`🔑 Mot de passe: 123456`)
  console.log(`👤 ID: ${user.id}`)
}

createTestUser()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })