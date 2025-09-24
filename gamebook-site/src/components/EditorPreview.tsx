'use client'

import { useState, useEffect } from 'react'
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
  pages: StoryPage[]
}

type StoryPage = {
  id: number
  pageNumber: number
  title: string | null
  content: string
  imageUrl: string | null
  isStartingPage: boolean
  choices: StoryChoice[]
}

type StoryChoice = {
  id: number
  pageId: number
  text: string
  targetPageId: number | null
  diceRequired: number | null
  diceTarget: number | null
  statsRequired: string | null
  failureType: string | null
  failureDamage: number | null
  failurePageId: number | null
  allowRetry: boolean
  retryText: string | null
}

interface EditorPreviewProps {
  story: Story
  user: User
}

export default function EditorPreview({ story, user }: EditorPreviewProps) {
  const router = useRouter()
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(
    story.pages.find(p => p.isStartingPage)?.pageNumber || story.pages[0]?.pageNumber || 1
  )
  const [pageNumberInput, setPageNumberInput] = useState<string>('')
  const [history, setHistory] = useState<number[]>([])

  const currentPage = story.pages.find(p => p.pageNumber === currentPageNumber)
  const allPages = story.pages.sort((a, b) => a.pageNumber - b.pageNumber)

  const navigateToPageNumber = (pageNumber: number) => {
    if (story.pages.find(p => p.pageNumber === pageNumber)) {
      setHistory(prev => [...prev, currentPageNumber])
      setCurrentPageNumber(pageNumber)
    }
  }

  const navigateToPageById = (pageId: number) => {
    const page = story.pages.find(p => p.id === pageId)
    if (page) {
      navigateToPageNumber(page.pageNumber)
    }
  }

  const goBack = () => {
    if (history.length > 0) {
      const previousPageNumber = history[history.length - 1]
      setHistory(prev => prev.slice(0, -1))
      setCurrentPageNumber(previousPageNumber)
    }
  }

  const jumpToPage = () => {
    const pageNumber = parseInt(pageNumberInput)
    if (!isNaN(pageNumber) && story.pages.find(p => p.pageNumber === pageNumber)) {
      navigateToPageNumber(pageNumber)
      setPageNumberInput('')
    }
  }

  const getChoiceStatus = (choice: StoryChoice) => {
    if (choice.diceRequired && choice.diceTarget) {
      return `🎲 Dé requis (${choice.diceRequired}+ vs ${choice.diceTarget})`
    }
    if (choice.statsRequired) {
      return `📊 Stats: ${choice.statsRequired}`
    }
    return null
  }

  const getChoiceDestination = (choice: StoryChoice) => {
    if (choice.targetPageId) {
      const targetPage = story.pages.find(p => p.id === choice.targetPageId)
      return targetPage ? `→ Page ${targetPage.pageNumber}` : '→ Page introuvable'
    }
    return '→ Fin de l\'histoire'
  }

  if (!currentPage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Page introuvable (Numéro: {currentPageNumber})
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header avec navigation d'éditeur */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">{story.title}</h1>
            <p className="text-blue-700">Mode Prévisualisation Éditeur</p>
          </div>
          <button
            onClick={() => router.push('/editor')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            ← Retour à l'éditeur
          </button>
        </div>
        
        {/* Navigation rapide */}
        <div className="flex gap-4 items-center flex-wrap">
          <button
            onClick={goBack}
            disabled={history.length === 0}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            ← Précédent
          </button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="N° page"
              value={pageNumberInput}
              onChange={(e) => setPageNumberInput(e.target.value)}
              className="border rounded px-2 py-1 w-20 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && jumpToPage()}
            />
            <button
              onClick={jumpToPage}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Aller à
            </button>
          </div>
          
          <span className="text-sm text-blue-600">
            Page actuelle: {currentPageNumber} | Total pages: {story.pages.length}
          </span>
        </div>
      </div>

      {/* Contenu de la page */}
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
              className="max-w-full h-auto rounded-lg shadow-md"
            />
          </div>
        )}
      </div>

      {/* Choix avec informations d'éditeur */}
      {currentPage.choices.length > 0 && (
        <div className="bg-gray-50 border rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Choix disponibles :</h3>
          <div className="space-y-3">
            {currentPage.choices.map((choice) => (
              <div key={choice.id} className="border border-gray-300 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <button
                      onClick={() => choice.targetPageId && navigateToPageById(choice.targetPageId)}
                      disabled={!choice.targetPageId}
                      className="text-left w-full text-blue-600 hover:text-blue-800 font-medium mb-2 disabled:text-gray-500"
                    >
                      {choice.text}
                    </button>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>{getChoiceDestination(choice)}</div>
                      {getChoiceStatus(choice) && (
                        <div className="text-orange-600">{getChoiceStatus(choice)}</div>
                      )}
                      {choice.failureType && (
                        <div className="text-red-600">
                          ⚠️ Échec possible: {choice.failureType}
                          {choice.failureDamage && ` (-${choice.failureDamage} PV)`}
                          {choice.failurePageId && (() => {
                            const failurePage = story.pages.find(p => p.id === choice.failurePageId)
                            return failurePage ? ` → Page ${failurePage.pageNumber}` : ` → Page introuvable`
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 ml-4">
                    ID: {choice.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des pages pour navigation rapide */}
      <div className="mt-8 bg-gray-50 border rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Navigation rapide :</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {allPages.map((page) => (
            <button
              key={page.id}
              onClick={() => navigateToPageNumber(page.pageNumber)}
              className={`p-2 rounded text-sm transition-colors ${
                page.pageNumber === currentPageNumber
                  ? 'bg-blue-600 text-white'
                  : page.isStartingPage
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={page.title || `Page ${page.pageNumber}`}
            >
              {page.pageNumber}
              {page.isStartingPage && ' 🏠'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}