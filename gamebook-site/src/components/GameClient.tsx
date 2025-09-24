'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: number
  username: string
  email: string
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
  story: Story
}

type StoryChoice = {
  id: number
  pageId: number
  text: string
  targetPageId: number | null
  diceRequired: number | null
  diceTarget: number | null
  statsRequired: string | null
  // Nouveaux champs pour la gestion des échecs
  failureType: string | null      // "combat", "trap", "puzzle", "social"
  failureDamage: number | null    // Dégâts en cas d'échec
  failurePageId: number | null    // Page alternative en cas d'échec
  allowRetry: boolean             // Permet de refaire le test
  retryText: string | null        // Texte pour retry
}

type StoryPage = {
  id: number
  storyId: number
  pageNumber: number
  title: string | null
  content: string
  imageUrl: string | null
  isStartPage: boolean
  choices: StoryChoice[]
}

interface GameClientProps {
  gameSession: GameSession
  currentPage: StoryPage
  user: User
}

export default function GameClient({ gameSession, currentPage, user }: GameClientProps) {
  const [loading, setLoading] = useState(false)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [showDice, setShowDice] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<StoryChoice | null>(null)
  const router = useRouter()

  const rollDice = (sides = 6): Promise<number> => {
    return new Promise((resolve) => {
      setShowDice(true)
      setDiceResult(null)
      
      // Animation du dé
      let count = 0
      const interval = setInterval(() => {
        setDiceResult(Math.floor(Math.random() * sides) + 1)
        count++
        
        if (count > 10) {
          clearInterval(interval)
          const finalResult = Math.floor(Math.random() * sides) + 1
          setDiceResult(finalResult)
          setTimeout(() => resolve(finalResult), 1000)
        }
      }, 100)
    })
  }

  // Fonction pour mettre à jour les points de vie
  const updateHealth = async (damage: number) => {
    try {
      const response = await fetch('/api/game/update-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: gameSession.id,
          damage: damage
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des PV')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des PV:', error)
    }
  }

  // Nouvelle fonction pour gérer les échecs
  const handleFailure = async (choice: StoryChoice, testResult: any) => {
    const failureType = choice.failureType || 'unknown'
    
    let message = ''
    if (testResult.stat) {
      message = `Test de ${testResult.stat}:
Votre ${testResult.stat.toLowerCase()}: ${testResult.playerStat}
Dé: ${testResult.diceRoll}
Total: ${testResult.totalScore}
Difficulté: ${testResult.requiredScore}

❌ Échec !`
    } else {
      message = `Échec ! Vous avez obtenu ${testResult.diceRoll}, il fallait au moins ${testResult.target}.`
    }

    switch (failureType) {
      case 'combat':
      case 'trap':
        // Combat/Piège : Prendre des dégâts
        const damage = choice.failureDamage || 2
        message += `\n\n💥 Vous subissez ${damage} points de dégâts !`
        
        // Vérifier si le joueur peut continuer
        const newHealth = gameSession.health - damage
        if (newHealth <= 0) {
          message += '\n\n💀 GAME OVER !'
          alert(message)
          // Rediriger vers le menu principal
          router.push('/game-menu')
          return
        }
        
        // Mettre à jour les PV
        await updateHealth(damage)
        
        if (choice.allowRetry) {
          message += `\n\n${choice.retryText || 'Voulez-vous réessayer ?'}`
          alert(message)
          // Permettre de refaire le test en rechargeant les données
          router.refresh()
        } else {
          alert(message)
          router.refresh()
        }
        break

      case 'puzzle':
      case 'social':
        // Énigme/Social : Aller vers une page alternative
        message += '\n\nVous devez trouver une autre approche...'
        alert(message)
        
        if (choice.failurePageId) {
          // Aller vers la page d'échec alternative
          const response = await fetch('/api/game/make-choice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: gameSession.id,
              choiceId: choice.id,
              forcePage: choice.failurePageId
            }),
          })

          if (response.ok) {
            router.refresh()
          }
        }
        break

      default:
        // Comportement par défaut : rester sur la page
        alert(message + '\n\nVous ne pouvez pas continuer par cette voie.')
        break
    }
  }

  const handleChoice = async (choice: StoryChoice) => {
    if (loading) return
    
    setLoading(true)
    setSelectedChoice(choice)
    setShowDice(false)
    setDiceResult(null)

    try {
      let canProceed = true
      let diceRoll = null
      let testResult = null

      // Nouveau système : Test de caractéristique avec dé
      if (choice.statsRequired) {
        const requirements = JSON.parse(choice.statsRequired)
        
        for (const [stat, difficulty] of Object.entries(requirements)) {
          const playerStat = gameSession[stat as keyof typeof gameSession] as number
          
          // Lancer le dé (1-6)
          diceRoll = await rollDice(6)
          const totalScore = playerStat + diceRoll
          const requiredScore = difficulty as number
          
          testResult = {
            stat: stat.charAt(0).toUpperCase() + stat.slice(1),
            playerStat,
            diceRoll,
            totalScore,
            requiredScore,
            success: totalScore >= requiredScore
          }
          
          canProceed = testResult.success
          
          // Gestion de l'échec selon le type
          if (!canProceed) {
            await handleFailure(choice, testResult)
            return // Sortir de la fonction pour gérer l'échec
          } else {
            // Afficher le résultat du succès
            const resultMessage = `Test de ${testResult.stat}:
Votre ${testResult.stat.toLowerCase()}: ${testResult.playerStat}
Dé: ${testResult.diceRoll}
Total: ${testResult.totalScore}
Difficulté: ${testResult.requiredScore}

✅ Réussi !`
            
            alert(resultMessage)
          }
          break // On ne teste qu'une stat à la fois
        }
      }

      // Ancien système : Test de dé pur (on le garde pour certains choix)
      else if (choice.diceRequired && choice.diceTarget) {
        diceRoll = await rollDice(6)
        canProceed = diceRoll >= choice.diceTarget
        
        if (!canProceed) {
          await handleFailure(choice, { diceRoll, target: choice.diceTarget })
          return
        } else {
          alert(`Réussi ! Vous avez obtenu ${diceRoll} (${choice.diceTarget}+ requis).`)
        }
      }

      if (canProceed) {
        // Construire le payload
        const payload: any = {
          sessionId: gameSession.id,
          choiceId: choice.id,
        }
        
        // N'ajouter diceRoll que s'il y en a un
        if (diceRoll !== null) {
          payload.diceRoll = diceRoll
        }
        
        // Faire le choix
        const response = await fetch('/api/game/make-choice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Erreur lors du traitement du choix')
        }

        const result = await response.json()
        
        if (result.isCompleted) {
          alert('Félicitations ! Vous avez terminé cette aventure !')
          router.push('/game-menu')
        } else {
          // Recharger la page pour afficher la nouvelle section
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du traitement du choix')
    } finally {
      setLoading(false)
      setSelectedChoice(null)
      setTimeout(() => {
        setShowDice(false)
        setDiceResult(null)
      }, 2000)
    }
  }

  const canUseChoice = (choice: StoryChoice): boolean => {
    if (choice.statsRequired) {
      const requirements = JSON.parse(choice.statsRequired)
      
      for (const [stat, value] of Object.entries(requirements)) {
        const playerValue = gameSession[stat as keyof typeof gameSession] as number
        if (playerValue < (value as number)) {
          return false
        }
      }
    }
    
    return true
  }

  // Fonction utilitaire pour convertir le nom de stat en français
  const getStatName = (stat: string): string => {
    const statNames: { [key: string]: string } = {
      force: 'Force',
      intelligence: 'Intelligence',
      agilite: 'Agilité',
      charisme: 'Charisme',
      vie: 'Vie'
    }
    return statNames[stat] || stat.charAt(0).toUpperCase() + stat.slice(1)
  }

  const getChoiceTooltip = (choice: StoryChoice): string => {
    const parts = []
    
    // Système avec statsRequired (stat + dé vs difficulté)
    if (choice.statsRequired) {
      const requirements = JSON.parse(choice.statsRequired)
      
      for (const [stat, value] of Object.entries(requirements)) {
        const playerValue = gameSession[stat as keyof typeof gameSession] as number
        const statName = getStatName(stat)
        parts.push(`Test: ${statName} ${playerValue} + dé (1-6) vs difficulté ${value}`)
      }
    }
    
    if (choice.diceRequired && choice.diceTarget) {
      parts.push(`Dé requis: ${choice.diceTarget}+`)
    }
    
    return parts.join(' | ')
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header avec infos du joueur */}
        <div className="bg-gray-100 border rounded-lg p-4 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{gameSession.story.title}</h1>
              <p className="text-gray-800">{user.username} le {gameSession.characterClass}</p>
            </div>
            
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-red-400 font-bold text-lg">❤️ {gameSession.health}</div>
                <div className="text-xs text-gray-700">Vie</div>
              </div>
              <div>
                <div className="text-orange-400 font-bold text-lg">💪 {gameSession.strength}</div>
                <div className="text-xs text-gray-700">Force</div>
              </div>
              <div>
                <div className="text-green-400 font-bold text-lg">🏃 {gameSession.dexterity}</div>
                <div className="text-xs text-gray-700">Dextérité</div>
              </div>
              <div>
                <div className="text-purple-400 font-bold text-lg">🧠 {gameSession.intelligence}</div>
                <div className="text-xs text-gray-700">Intelligence</div>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/game-menu')}
              className="text-gray-800 hover:text-gray-600 transition-colors text-sm"
            >
              ← Retour au menu
            </button>
          </div>
        </div>

        {/* Contenu de la page actuelle */}
        <div className="bg-gray-50 border rounded-lg p-6 mb-6 shadow-xl">
          {currentPage.title && (
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentPage.title}</h2>
          )}
          
          <div className="text-gray-900 leading-relaxed whitespace-pre-wrap mb-6">
            {currentPage.content}
          </div>

          {currentPage.imageUrl && (
            <div className="mb-6">
              <img 
                src={currentPage.imageUrl} 
                alt="Illustration" 
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Lanceur de dé */}
        {showDice && (
          <div className="bg-gray-50 border rounded-lg p-6 mb-6 shadow-xl text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🎲 Lancer de dé</h3>
            {diceResult && (
              <div className="text-6xl font-bold text-yellow-400 animate-bounce">
                {diceResult}
              </div>
            )}
            {!diceResult && (
              <div className="text-4xl animate-spin">🎲</div>
            )}
          </div>
        )}

        {/* Choix disponibles */}
        <div className="bg-gray-50 border rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Que voulez-vous faire ?</h3>
          
          <div className="space-y-3">
            {currentPage.choices.map((choice) => {
              const isAvailable = canUseChoice(choice)
              const tooltip = getChoiceTooltip(choice)
              
              return (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice)}
                  disabled={!isAvailable || loading || (selectedChoice?.id === choice.id)}
                  title={tooltip}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    isAvailable
                      ? 'bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/50 text-white'
                      : 'bg-gray-600/30 border border-gray-500/50 text-gray-400 cursor-not-allowed'
                  } ${selectedChoice?.id === choice.id ? 'animate-pulse' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span>{choice.text}</span>
                    {tooltip && (
                      <span className="text-xs text-gray-700">
                        {tooltip}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          
          {loading && (
            <div className="text-center mt-4">
              <span className="text-gray-800">Traitement en cours...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}