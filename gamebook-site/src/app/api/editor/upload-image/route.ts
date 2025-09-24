import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getCurrentUser } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const pageId = data.get('pageId') as string

    if (!file || !pageId) {
      return NextResponse.json({ error: 'Fichier ou ID de page manquant' }, { status: 400 })
    }

    // Vérifications du fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      return NextResponse.json({ error: 'Le fichier ne peut pas dépasser 5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'pages')
    await mkdir(uploadsDir, { recursive: true })

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop()
    const fileName = `page-${pageId}-${Date.now()}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // Sauvegarder le fichier
    await writeFile(filePath, buffer)

    // URL relative pour la base de données
    const imageUrl = `/uploads/pages/${fileName}`

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      message: 'Image uploadée avec succès'
    })

  } catch (error) {
    console.error('Erreur upload image:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload de l\'image' },
      { status: 500 }
    )
  }
}