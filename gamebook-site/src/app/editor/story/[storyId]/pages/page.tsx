'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageEditor from '@/components/PageEditor'

interface PageProps {
  params: Promise<{ storyId: string }>
}

export default function StoryPagesPage({ params }: PageProps) {
  const [story, setStory] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [storyId, setStoryId] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params
        const id = resolvedParams.storyId
        setStoryId(id)

        // Récupérer l'utilisateur
        const userResponse = await fetch('/api/auth/user')
        if (!userResponse.ok) {
          router.push('/')
          return
        }
        const userData = await userResponse.json()
        setUser(userData)

        // Récupérer l'histoire
        const storyResponse = await fetch(`/api/editor/story/${id}`)
        if (!storyResponse.ok) {
          router.push('/editor')
          return
        }
        const storyData = await storyResponse.json()
        setStory(storyData)
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
        router.push('/editor')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params, router])

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

  if (!story || !user) {
    return null
  }

  const reloadStoryData = async () => {
    try {
      const storyResponse = await fetch(`/api/editor/story/${storyId}`)
      if (storyResponse.ok) {
        const storyData = await storyResponse.json()
        setStory(storyData)
      }
    } catch (error) {
      console.error('Erreur lors du rechargement:', error)
    }
  }

  const handleToggleStatus = async () => {
    if (!story) return

    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/editor/story/${story.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !story.isPublished })
      })

      if (response.ok) {
        const result = await response.json()
        setStory({ ...story, isPublished: result.isPublished })
        alert(result.message)
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du statut')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDeleteStory = async () => {
    if (!story) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/editor/story/${story.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        router.push('/editor')
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression de l\'histoire')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">📖 Éditeur de Pages</h1>
              <h2 className="text-xl text-blue-200 mb-2">{story.title}</h2>
              <p className="text-blue-300 text-sm">{story.description}</p>
            </div>
            
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  story.isPublished 
                    ? 'bg-green-600/20 text-green-300' 
                    : 'bg-yellow-600/20 text-yellow-300'
                }`}>
                  {story.isPublished ? '✅ Terminée' : '🚧 En cours'}
                </span>
                <button
                  onClick={handleToggleStatus}
                  disabled={updatingStatus}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    story.isPublished
                      ? 'bg-yellow-600/50 hover:bg-yellow-600/70 text-white'
                      : 'bg-green-600/50 hover:bg-green-600/70 text-white'
                  } disabled:opacity-50`}
                >
                  {updatingStatus 
                    ? '...' 
                    : story.isPublished 
                      ? 'Marquer en cours' 
                      : 'Marquer terminée'
                  }
                </button>
              </div>
              
              <div className="h-6 w-px bg-white/20"></div>
              
              <button 
                onClick={() => window.open(`/stories/${story.id}?preview=editor`, '_blank')}
                className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600/70 rounded-lg text-white transition-all"
              >
                👁️ Prévisualiser (Mode Éditeur)
              </button>
              
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600/50 hover:bg-red-600/70 rounded-lg text-white transition-all"
              >
                🗑️ Supprimer
              </button>
              
              <button 
                className="px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg text-white transition-all"
                onClick={() => window.location.href = '/editor'}
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>

        {/* Éditeur */}
        <PageEditor story={story as any} user={user} onDataChange={reloadStoryData} />
      </div>

      {/* Modale de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-4">
                Supprimer l'histoire ?
              </h3>
              <p className="text-blue-200 mb-6">
                Cette action est <strong>irréversible</strong>. L'histoire "{story.title}" 
                et toutes ses pages seront définitivement supprimées.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded text-white transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteStory}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600/50 hover:bg-red-600/70 rounded text-white transition-all disabled:opacity-50"
                >
                  {deleting ? 'Suppression...' : 'Supprimer définitivement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}