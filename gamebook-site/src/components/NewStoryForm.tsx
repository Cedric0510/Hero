'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface NewStoryFormProps {
  user: {
    id: number
    username: string
    email: string
  }
}

export default function NewStoryForm({ user }: NewStoryFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [authorName, setAuthorName] = useState(user.username)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('Le titre est obligatoire')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/editor/story/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          authorName: authorName.trim() || user.username
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création')
      }

      const result = await response.json()
      
      // Rediriger vers l'éditeur de pages
      router.push(`/editor/story/${result.storyId}/pages`)
      
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création de l\'histoire')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-blue-200 mb-2">
            Titre de l'histoire *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            placeholder="Ex: L'Aventure de la Forêt Enchantée"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-blue-200 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
            placeholder="Décrivez votre histoire en quelques lignes..."
          />
        </div>

        {/* Nom d'auteur */}
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-blue-200 mb-2">
            Nom d'auteur
          </label>
          <input
            type="text"
            id="authorName"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            placeholder="Votre nom d'auteur"
          />
        </div>

        {/* Conseils */}
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-blue-200 font-semibold mb-2">💡 Conseils pour commencer</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Choisissez un titre accrocheur et descriptif</li>
            <li>• La description apparaîtra dans la liste des histoires</li>
            <li>• Vous pourrez ajouter des pages et des choix après la création</li>
            <li>• N'oubliez pas de marquer une page comme "page de départ"</li>
          </ul>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 pt-4">
          <Link 
            href="/editor"
            className="px-6 py-3 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg text-white transition-all"
          >
            ← Annuler
          </Link>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              loading || !title.trim()
                ? 'bg-gray-600/30 text-gray-400 cursor-not-allowed'
                : 'bg-green-600/70 hover:bg-green-600/90 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                Création en cours...
              </span>
            ) : (
              '✨ Créer l\'histoire'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}