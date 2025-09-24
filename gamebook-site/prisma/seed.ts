import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Ajout de données de test...')

  // Créer une histoire d'exemple
  const story = await prisma.story.create({
    data: {
      title: 'La Forêt Mystérieuse',
      description: 'Une aventure épique dans une forêt enchantée pleine de créatures magiques et de dangers mystérieux. Votre courage sera-t-il suffisant pour percer les secrets de cette forêt ?',
      authorName: 'Maître du Jeu',
      isPublished: true,
    }
  })

  // Créer des pages pour l'histoire
  const startPage = await prisma.storyPage.create({
    data: {
      storyId: story.id,
      pageNumber: 1,
      title: 'L\'entrée de la forêt',
      content: `Vous vous trouvez à l'orée d'une forêt mystérieuse. Les arbres semblent murmurer des secrets anciens, et une brume légère flotte entre leurs troncs. 

Deux chemins s'offrent à vous :`,
      isStartPage: true,
    }
  })

  const page2 = await prisma.storyPage.create({
    data: {
      storyId: story.id,
      pageNumber: 2,
      title: 'Le sentier de gauche',
      content: `Vous prenez le sentier de gauche. Après quelques minutes de marche, vous entendez un bruit étrange dans les buissons.

Soudain, un petit lutin vert apparaît !

"Halt, voyageur !" dit-il. "Pour passer, tu dois répondre à mon énigme ou me battre au dé !"`,
    }
  })

  const page3 = await prisma.storyPage.create({
    data: {
      storyId: story.id,
      pageNumber: 3,
      title: 'Le sentier de droite',
      content: `Vous choisissez le sentier de droite. Le chemin serpente à travers des arbres majestueux.

Bientôt, vous arrivez devant une clairière où se dresse une fontaine magique. L'eau scintille d'une lumière argentée.

Une inscription gravée dans la pierre dit : "Bois et gagne en sagesse, mais attention aux conséquences..."`,
    }
  })

  const page4 = await prisma.storyPage.create({
    data: {
      storyId: story.id,
      pageNumber: 4,
      title: 'Victoire contre le lutin',
      content: `Bravo ! Vous avez réussi l'épreuve du lutin !

"Impressionnant, voyageur !" s'exclame le lutin. "Tu as prouvé ta valeur. Prends ceci comme récompense !"

Il vous tend une potion de vie qui restaure 5 points de vie.

Vous pouvez maintenant continuer votre chemin dans la forêt profonde.`,
    }
  })

  // Créer les choix pour la page de départ
  await prisma.storyChoice.create({
    data: {
      pageId: startPage.id,
      text: 'Prendre le sentier de gauche (mystérieux)',
      targetPageId: page2.id,
    }
  })

  await prisma.storyChoice.create({
    data: {
      pageId: startPage.id,
      text: 'Prendre le sentier de droite (lumineux)',
      targetPageId: page3.id,
    }
  })

  // Créer une page d'échec pour l'énigme
  const failurePage = await prisma.storyPage.create({
    data: {
      storyId: story.id,
      pageNumber: 5,
      title: 'Échec de l\'énigme',
      content: `Le lutin secoue la tête avec un sourire moqueur.

"Mauvaise réponse, voyageur ! Mais je suis généreux... Je vais te donner un indice : 'Ce qui brille n'est pas toujours or, mais l'or brille toujours.'"

Vous pouvez réessayer ou choisir une autre approche.`,
    }
  })

  // Créer une page de piège
  const trapPage = await prisma.storyPage.create({
    data: {
      storyId: story.id,
      pageNumber: 6,
      title: 'Un piège sournois',
      content: `En explorant plus profondément dans la forêt, vous marchez sur une plaque de pierre qui s'enfonce légèrement.

*CLIC*

Un piège ! Des flèches jaillissent des arbres environnants !

Vous devez être rapide pour les éviter...`,
    }
  })

  // Choix pour la page du lutin
  await prisma.storyChoice.create({
    data: {
      pageId: page2.id,
      text: 'Répondre à l\'énigme (Intelligence requis: 12+)',
      targetPageId: page4.id,
      statsRequired: JSON.stringify({ intelligence: 12 }),
      failureType: 'puzzle',
      failurePageId: failurePage.id,
      allowRetry: false
    } as any
  })

  await prisma.storyChoice.create({
    data: {
      pageId: page2.id,
      text: 'Défier le lutin au combat (Force requis: 15+)',
      targetPageId: page4.id,
      statsRequired: JSON.stringify({ strength: 15 }),
      failureType: 'combat',
      failureDamage: 3,
      allowRetry: true,
      retryText: 'Continuer le combat malgré vos blessures ?'
    } as any
  })

  // Ajouter le piège depuis la page de la fontaine
  await prisma.storyChoice.create({
    data: {
      pageId: page3.id,
      text: 'Explorer plus profondément la forêt',
      targetPageId: trapPage.id,
    }
  })

  // Choix pour la page de piège
  await prisma.storyChoice.create({
    data: {
      pageId: trapPage.id,
      text: 'Esquiver rapidement (Dextérité requis: 14+)',
      targetPageId: page4.id,
      statsRequired: JSON.stringify({ dexterity: 14 }),
      failureType: 'trap',
      failureDamage: 4,
      allowRetry: true,
      retryText: 'Essayer de ramper sous les flèches ?'
    } as any
  })

  // Choix de retry pour la page d'échec de l'énigme
  await prisma.storyChoice.create({
    data: {
      pageId: failurePage.id,
      text: 'Réessayer l\'énigme avec l\'indice (Intelligence requis: 10+)',
      targetPageId: page4.id,
      statsRequired: JSON.stringify({ intelligence: 10 }),
      failureType: 'puzzle',
      failurePageId: failurePage.id,
      allowRetry: false
    } as any
  })

  await prisma.storyChoice.create({
    data: {
      pageId: failurePage.id,
      text: 'Chercher un autre chemin',
      targetPageId: page3.id,
    }
  })

  // Choix pour la fontaine magique
  await prisma.storyChoice.create({
    data: {
      pageId: page3.id,
      text: 'Boire à la fontaine',
      targetPageId: page4.id,
    }
  })

  await prisma.storyChoice.create({
    data: {
      pageId: page3.id,
      text: 'Continuer sans boire',
      targetPageId: page4.id,
    }
  })

  // Créer une deuxième histoire
  const story2 = await prisma.story.create({
    data: {
      title: 'Le Donjon du Dragon',
      description: 'Explorez un donjon sombre et dangereux où un dragon garde un trésor légendaire. Seuls les plus braves oseront affronter cette quête périlleuse.',
      authorName: 'Seigneur des Donjons',
      isPublished: true,
    }
  })

  const startPage2 = await prisma.storyPage.create({
    data: {
      storyId: story2.id,
      pageNumber: 1,
      title: 'L\'entrée du donjon',
      content: `Vous vous dressez devant l'entrée d'un ancien donjon. Des torches vacillantes éclairent faiblement un couloir qui s'enfonce dans les ténèbres.

Une odeur de soufre émane des profondeurs...

Comment voulez-vous procéder ?`,
      isStartPage: true,
    }
  })

  const page2Story2 = await prisma.storyPage.create({
    data: {
      storyId: story2.id,
      pageNumber: 2,
      title: 'Exploration furtive',
      content: `Vous vous déplacez silencieusement dans les couloirs sombres. Votre prudence paie : vous évitez plusieurs pièges !

Vous arrivez dans une salle avec deux portes : l'une en bois massif, l'autre en métal rouillé.`,
    }
  })

  await prisma.storyChoice.create({
    data: {
      pageId: startPage2.id,
      text: 'Entrer prudemment (Dextérité requis: 10+)',
      targetPageId: page2Story2.id,
      statsRequired: JSON.stringify({ dexterity: 10 })
    }
  })

  await prisma.storyChoice.create({
    data: {
      pageId: startPage2.id,
      text: 'Foncer tête baissée (Force requis: 12+)',
      targetPageId: page2Story2.id,
      statsRequired: JSON.stringify({ strength: 12 })
    }
  })

  console.log('✅ Données de test ajoutées avec succès !')
  console.log(`📚 Histoire 1: "${story.title}" (ID: ${story.id})`)
  console.log(`📚 Histoire 2: "${story2.title}" (ID: ${story2.id})`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'ajout des données:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })