'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditorPage() {
  const [stories, setStories] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        // Récupérer l'utilisateur
        const userResponse = await fetch('/api/auth/user')
        if (!userResponse.ok) {
          router.push('/')
          return
        }
        const userData = await userResponse.json()
        setUser(userData)

        // Récupérer les histoires
        const storiesResponse = await fetch('/api/editor/stories')
        if (storiesResponse.ok) {
          const storiesData = await storiesResponse.json()
          setStories(storiesData)
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-center">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">📝 Éditeur d'Histoires</h1>
              <p className="text-blue-200">Créez et modifiez vos livres dont vous êtes le héros</p>
            </div>
            
            <div className="flex gap-4">
              <Link 
                href="/game-menu"
                className="px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg text-white transition-all"
              >
                ← Retour au jeu
              </Link>
              <Link 
                href="/editor/story/new"
                className="px-6 py-2 bg-green-600/70 hover:bg-green-600/90 rounded-lg text-white font-semibold transition-all"
              >
                ✨ Nouvelle Histoire
              </Link>
            </div>
          </div>
        </div>

        {/* Liste des histoires */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">Vos Histoires</h2>
          
          {stories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-blue-200 text-lg mb-4">Aucune histoire créée pour le moment</p>
              <Link 
                href="/editor/story/new"
                className="inline-block px-6 py-3 bg-blue-600/70 hover:bg-blue-600/90 rounded-lg text-white font-semibold transition-all"
              >
                Créer votre première histoire
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div key={story.id} className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{story.title}</h3>
                      <p className="text-blue-200 text-sm line-clamp-3">{story.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      story.isPublished 
                        ? 'bg-green-600/30 text-green-200 border border-green-500/50' 
                        : 'bg-orange-600/30 text-orange-200 border border-orange-500/50'
                    }`}>
                      {story.isPublished ? 'Publié' : 'Brouillon'}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-blue-300 mb-4">
                    <span>Par {story.authorName}</span>
                    <div className="flex gap-4">
                      <span>📄 {story._count.pages} pages</span>
                      <span>👥 {story._count.gameSessions} joueurs</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/editor/story/${story.id}/pages`}
                      className="flex-1 px-4 py-2 bg-blue-600/50 hover:bg-blue-600/70 rounded-lg text-white text-center transition-all"
                    >
                      📝 Éditer
                    </Link>
                    <button 
                      className="px-4 py-2 bg-red-600/50 hover:bg-red-600/70 rounded-lg text-white transition-all"
                      onClick={async () => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer l'histoire "${story.title}" ?\n\nCette action est irréversible et supprimera toutes les pages et choix associés.`)) {
                          try {
                            const response = await fetch(`/api/editor/story/${story.id}`, {
                              method: 'DELETE'
                            })

                            if (response.ok) {
                              const result = await response.json()
                              alert(result.message)
                              // Recharger la liste des histoires
                              window.location.reload()
                            } else {
                              const error = await response.json()
                              alert(error.error || 'Erreur lors de la suppression')
                            }
                          } catch (error) {
                            console.error('Erreur:', error)
                            alert('Erreur lors de la suppression de l\'histoire')
                          }
                        }
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aide rapide */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mt-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">🚀 Guide rapide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-blue-300 mb-2">1. Créer l'histoire</h4>
              <p className="text-blue-200">Titre, description, nom d'auteur</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-green-300 mb-2">2. Ajouter des pages</h4>
              <p className="text-blue-200">Contenu, titre, numéro de page</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-purple-300 mb-2">3. Configurer les choix</h4>
              <p className="text-blue-200">Tests, échecs, dégâts, chemins alternatifs</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-orange-300 mb-2">4. Publier & Tester</h4>
              <p className="text-blue-200">Rendre visible aux joueurs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}