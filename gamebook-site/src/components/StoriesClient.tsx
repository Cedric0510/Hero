'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type User = {
  id: number
  username: string
  email: string
}

type StoryWithCount = {
  id: number
  title: string
  description: string | null
  authorName: string
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    gameSessions: number
  }
}

interface StoriesClientProps {
  stories: StoryWithCount[]
  user: User
}

export default function StoriesClient({ stories, user }: StoriesClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)

  const handleStartStory = async (storyId: number) => {
    setLoading(storyId)
    
    try {
      // Créer une nouvelle session de jeu
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors du démarrage de l\'histoire')
      }

      const { sessionId } = await response.json()
      
      // Rediriger vers la page de création de personnage ou directement vers le jeu
      router.push(`/game/${sessionId}/character-creation`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du démarrage de l\'histoire')
    } finally {
      setLoading(null)
    }
  }

  const handleGoBack = () => {
    router.push('/game-menu')
  }

  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      <div className="flex justify-start">
        <button
          onClick={handleGoBack}
          className="flex items-center text-blue-200 hover:text-white transition-colors"
        >
          <span className="mr-2">←</span>
          Retour au menu
        </button>
      </div>

      {/* Grille d'histoires */}
      {stories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-2xl font-bold text-white mb-2">Aucune histoire disponible</h2>
          <p className="text-blue-200">
            Les auteurs travaillent dur pour vous proposer de nouvelles aventures !
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {story.title}
                  </h3>
                  
                  <p className="text-blue-200 text-sm mb-3">
                    Par {story.authorName}
                  </p>
                  
                  <p className="text-blue-100 text-sm mb-4 line-clamp-3">
                    {story.description || 'Aucune description disponible.'}
                  </p>
                  
                  <div className="flex items-center text-blue-300 text-xs mb-4">
                    <span className="mr-2">👥</span>
                    {story._count.gameSessions} joueur(s) ont joué cette histoire
                  </div>
                </div>
                
                <button
                  onClick={() => handleStartStory(story.id)}
                  disabled={loading === story.id}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {loading === story.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Démarrage...
                    </span>
                  ) : (
                    'Commencer l\'aventure'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}