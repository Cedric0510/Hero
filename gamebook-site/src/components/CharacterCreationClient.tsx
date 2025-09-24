'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Story {
  title: string
  description: string | null
}

interface CharacterCreationClientProps {
  sessionId: number
  story: Story
}

const CHARACTER_CLASSES = [
  {
    name: 'Guerrier',
    description: 'Fort et résistant, excellent au combat rapproché',
    bonuses: { health: 5, strength: 3, dexterity: 0, intelligence: -1 },
    emoji: '⚔️'
  },
  {
    name: 'Mage',
    description: 'Maître de la magie, intelligent mais fragile',
    bonuses: { health: -2, strength: -1, dexterity: 1, intelligence: 4 },
    emoji: '🔮'
  },
  {
    name: 'Voleur',
    description: 'Agile et discret, expert en dextérité',
    bonuses: { health: 0, strength: 0, dexterity: 4, intelligence: 1 },
    emoji: '🗡️'
  },
  {
    name: 'Prêtre',
    description: 'Équilibré avec des capacités de guérison',
    bonuses: { health: 3, strength: 1, dexterity: 1, intelligence: 2 },
    emoji: '⛪'
  }
]

export default function CharacterCreationClient({ sessionId, story }: CharacterCreationClientProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCreateCharacter = async () => {
    if (!selectedClass) return

    setLoading(true)

    try {
      const response = await fetch('/api/game/create-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          characterClass: selectedClass
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création du personnage')
      }

      // Rediriger vers le jeu
      router.push(`/game/${sessionId}`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du personnage')
    } finally {
      setLoading(false)
    }
  }

  const selectedClassData = CHARACTER_CLASSES.find(c => c.name === selectedClass)
  const baseStats = { health: 20, strength: 10, dexterity: 10, intelligence: 10 }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Choisissez votre classe</h2>
        <p className="text-blue-200 text-sm">
          Votre classe détermine vos statistiques de départ et influence votre style de jeu.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {CHARACTER_CLASSES.map((charClass) => (
          <button
            key={charClass.name}
            onClick={() => setSelectedClass(charClass.name)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedClass === charClass.name
                ? 'border-blue-400 bg-blue-600/30'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">{charClass.emoji}</span>
              <h3 className="text-lg font-semibold text-white">{charClass.name}</h3>
            </div>
            <p className="text-blue-200 text-sm mb-3">{charClass.description}</p>
            
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-blue-300">Vie:</span>
                <span className={`${charClass.bonuses.health >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {baseStats.health + charClass.bonuses.health}
                  ({charClass.bonuses.health >= 0 ? '+' : ''}{charClass.bonuses.health})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">Force:</span>
                <span className={`${charClass.bonuses.strength >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {baseStats.strength + charClass.bonuses.strength}
                  ({charClass.bonuses.strength >= 0 ? '+' : ''}{charClass.bonuses.strength})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">Dextérité:</span>
                <span className={`${charClass.bonuses.dexterity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {baseStats.dexterity + charClass.bonuses.dexterity}
                  ({charClass.bonuses.dexterity >= 0 ? '+' : ''}{charClass.bonuses.dexterity})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">Intelligence:</span>
                <span className={`${charClass.bonuses.intelligence >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {baseStats.intelligence + charClass.bonuses.intelligence}
                  ({charClass.bonuses.intelligence >= 0 ? '+' : ''}{charClass.bonuses.intelligence})
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedClassData && (
        <div className="mb-6 p-4 bg-blue-600/20 rounded-lg border border-blue-400/30">
          <h3 className="text-lg font-semibold text-white mb-2">
            {selectedClassData.emoji} {selectedClassData.name} sélectionné
          </h3>
          <p className="text-blue-200 text-sm mb-3">{selectedClassData.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="text-center">
              <div className="text-red-400 font-semibold">
                {baseStats.health + selectedClassData.bonuses.health}
              </div>
              <div className="text-blue-300">Vie</div>
            </div>
            <div className="text-center">
              <div className="text-orange-400 font-semibold">
                {baseStats.strength + selectedClassData.bonuses.strength}
              </div>
              <div className="text-blue-300">Force</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-semibold">
                {baseStats.dexterity + selectedClassData.bonuses.dexterity}
              </div>
              <div className="text-blue-300">Dextérité</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-semibold">
                {baseStats.intelligence + selectedClassData.bonuses.intelligence}
              </div>
              <div className="text-blue-300">Intelligence</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => router.push('/game-menu')}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Annuler
        </button>
        
        <button
          onClick={handleCreateCharacter}
          disabled={!selectedClass || loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Création...' : 'Commencer l\'aventure !'}
        </button>
      </div>
    </div>
  )
}