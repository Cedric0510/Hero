'use client'

import { useRouter } from 'next/navigation'

type User = {
  id: number
  username: string
  email: string
  role?: string
  createdAt?: Date
}

type Story = {
  id: number
  title: string
  description: string | null
}

type GameSession = {
  id: number
  userId: number
  storyId: number
  currentPageId: number
  characterClass: string | null
  health: number
  strength: number
  dexterity: number
  intelligence: number
  inventory: string | null
  startedAt: Date
  lastPlayedAt: Date
  isCompleted: boolean
}

interface GameSessionWithStory extends GameSession {
  story: Story
}

interface GameMenuClientProps {
  user: User
  gameSessions: GameSessionWithStory[]
}

export default function GameMenuClient({ user, gameSessions }: GameMenuClientProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const handleNewGame = () => {
    router.push('/stories')
  }

  const handleContinueGame = (sessionId: number) => {
    router.push(`/game/${sessionId}`)
  }

  const handleRestartStory = (storyId: number) => {
    router.push(`/stories/${storyId}/restart`)
  }

  const handleAdminAccess = () => {
    router.push('/admin')
  }

  const continuableGames = gameSessions.filter(session => !session.isCompleted)
  const completedGames = gameSessions.filter(session => session.isCompleted)

  return (
    <div className="space-y-6">
      {/* Header avec navigation et déconnexion */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          {user.role === 'ADMIN' && (
            <button
              onClick={handleAdminAccess}
              className="text-blue-200 hover:text-white transition-colors text-sm flex items-center"
            >
              ⚙️ Administration
            </button>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="text-blue-200 hover:text-white transition-colors text-sm"
        >
          Se déconnecter
        </button>
      </div>

      {/* Menu principal */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Nouveau jeu */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
          <div className="text-center">
            <div className="text-4xl mb-4">🆕</div>
            <h2 className="text-xl font-bold text-white mb-2">Nouveau Jeu</h2>
            <p className="text-blue-200 mb-4 text-sm">
              Commencez une nouvelle aventure épique
            </p>
            <button
              onClick={handleNewGame}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Sélectionner une histoire
            </button>
          </div>
        </div>

        {/* Reprendre une partie */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
          <div className="text-center">
            <div className="text-4xl mb-4">▶️</div>
            <h2 className="text-xl font-bold text-white mb-2">Reprendre</h2>
            <p className="text-blue-200 mb-4 text-sm">
              Continuez là où vous vous êtes arrêté
            </p>
            {continuableGames.length > 0 ? (
              <div className="space-y-2">
                {continuableGames.slice(0, 3).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleContinueGame(session.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
                  >
                    {session.story.title}
                  </button>
                ))}
                {continuableGames.length > 3 && (
                  <p className="text-blue-300 text-xs">
                    +{continuableGames.length - 3} autre(s)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-blue-300 text-sm">
                Aucune partie en cours
              </p>
            )}
          </div>
        </div>

        {/* Recommencer une histoire */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
          <div className="text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h2 className="text-xl font-bold text-white mb-2">Recommencer</h2>
            <p className="text-blue-200 mb-4 text-sm">
              Rejouez une aventure depuis le début
            </p>
            {gameSessions.length > 0 ? (
              <div className="space-y-2">
                {Array.from(new Set(gameSessions.map(s => s.story.id)))
                  .slice(0, 3)
                  .map((storyId) => {
                    const story = gameSessions.find(s => s.story.id === storyId)?.story
                    return story ? (
                      <button
                        key={storyId}
                        onClick={() => handleRestartStory(storyId)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-3 rounded transition-colors"
                      >
                        {story.title}
                      </button>
                    ) : null
                  })}
              </div>
            ) : (
              <p className="text-blue-300 text-sm">
                Aucune histoire jouée
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Éditeur d'histoires - Accessible aux ADMIN et AUTHOR seulement */}
      {(user.role === 'ADMIN' || user.role === 'AUTHOR') && (
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-md rounded-lg p-6 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl">📝</div>
              <div>
                <h3 className="text-xl font-bold text-white">Éditeur d'Histoires</h3>
                <p className="text-blue-200 text-sm">Créez vos propres livres dont vous êtes le héros</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/editor')}
              className="px-6 py-3 bg-yellow-600/70 hover:bg-yellow-600/90 text-white font-semibold rounded-lg transition-all"
            >
              ✨ Ouvrir l'éditeur
            </button>
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Vos statistiques</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">{gameSessions.length}</div>
            <div className="text-blue-200 text-sm">Parties jouées</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{completedGames.length}</div>
            <div className="text-blue-200 text-sm">Aventures terminées</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{continuableGames.length}</div>
            <div className="text-blue-200 text-sm">En cours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              {Array.from(new Set(gameSessions.map(s => s.story.id))).length}
            </div>
            <div className="text-blue-200 text-sm">Histoires découvertes</div>
          </div>
        </div>
      </div>
    </div>
  )
}