import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { storyId } = await params

    const storyIdInt = parseInt(storyId)
    if (isNaN(storyIdInt)) {
      return NextResponse.json({ error: 'ID d\'histoire invalide' }, { status: 400 })
    }

    const story = await prisma.story.findUnique({
      where: { 
        id: storyIdInt
      },
      include: {
        pages: {
          include: {
            choices: true
          },
          orderBy: { pageNumber: 'asc' }
        }
      }
    })

    if (!story) {
      return NextResponse.json({ error: 'Histoire non trouvée' }, { status: 404 })
    }

    return NextResponse.json(story)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'histoire:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { storyId } = await params
    const storyIdNum = parseInt(storyId)

    // Vérifier que l'histoire existe
    const story = await prisma.story.findUnique({
      where: { id: storyIdNum },
      include: {
        pages: {
          include: {
            choices: true
          }
        },
        gameSessions: true
      }
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Histoire non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier les permissions (pour l'instant, on suppose que l'utilisateur peut supprimer toute histoire)
    // TODO: Ajouter une vérification d'autorisation basée sur l'auteur

    // Collecter les URLs des images à supprimer
    const imageUrls: string[] = []
    story.pages.forEach(page => {
      if (page.imageUrl) {
        imageUrls.push(page.imageUrl)
      }
    })

    // Supprimer les fichiers images du système de fichiers
    for (const imageUrl of imageUrls) {
      try {
        // Convertir l'URL relative en chemin absolu
        const imagePath = join(process.cwd(), 'public', imageUrl)
        await unlink(imagePath)
      } catch (error) {
        console.warn(`Impossible de supprimer l'image: ${imageUrl}`, error)
        // On continue même si la suppression d'image échoue
      }
    }

    // Supprimer l'histoire (cascade supprimera automatiquement pages et choix)
    await prisma.story.delete({
      where: { id: storyIdNum }
    })

    return NextResponse.json({
      success: true,
      message: 'Histoire supprimée avec succès',
      deletedImages: imageUrls.length
    })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'histoire:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'histoire' },
      { status: 500 }
    )
  }
}