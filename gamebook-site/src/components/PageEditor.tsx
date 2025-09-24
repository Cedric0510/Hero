'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Choice {
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

interface Page {
  id: number
  storyId: number
  pageNumber: number
  title: string | null
  content: string
  imageUrl: string | null
  isStartPage: boolean
  choices: Choice[]
}

interface Story {
  id: number
  title: string
  description: string | null
  authorName: string
  isPublished: boolean
  pages: Page[]
}

interface PageEditorProps {
  story: Story
  user: {
    id: number
    username: string
    email: string
  }
  onDataChange?: () => Promise<void>
}

export default function PageEditor({ story, user, onDataChange }: PageEditorProps) {
  const [selectedPage, setSelectedPage] = useState<Page | null>(story.pages[0] || null)
  const [showPageForm, setShowPageForm] = useState(false)
  const [showChoiceForm, setShowChoiceForm] = useState(false)
  const [editingChoice, setEditingChoice] = useState<Choice | null>(null)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [showEditPageForm, setShowEditPageForm] = useState(false)
  const router = useRouter()

  // Mettre à jour la page sélectionnée quand les données changent
  useEffect(() => {
    if (selectedPage && story.pages.length > 0) {
      // Trouver la page mise à jour avec le même ID
      const updatedPage = story.pages.find(p => p.id === selectedPage.id)
      if (updatedPage) {
        setSelectedPage(updatedPage)
      }
    } else if (!selectedPage && story.pages.length > 0) {
      // Si aucune page sélectionnée, sélectionner la première
      setSelectedPage(story.pages[0])
    }
  }, [story.pages, selectedPage])

  // Formulaire nouvelle page
  const [newPageForm, setNewPageForm] = useState({
    pageNumber: Math.max(...story.pages.map(p => p.pageNumber), 0) + 1,
    title: '',
    content: '',
    isStartPage: false,
    imageUrl: null as string | null
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  // Formulaire nouveau choix
  const [newChoiceForm, setNewChoiceForm] = useState({
    text: '',
    targetPageId: null as number | null,
    // Tests simples
    diceRequired: null as number | null,
    diceTarget: null as number | null,
    // Tests avec stats
    statType: '' as string,
    statValue: null as number | null,
    // Gestion des échecs
    failureType: '' as string,
    failureDamage: null as number | null,
    failurePageId: null as number | null,
    allowRetry: false,
    retryText: ''
  })

  const resetChoiceForm = () => {
    setNewChoiceForm({
      text: '',
      targetPageId: null,
      diceRequired: null,
      diceTarget: null,
      statType: '',
      statValue: null,
      failureType: '',
      failureDamage: null,
      failurePageId: null,
      allowRetry: false,
      retryText: ''
    })
    setEditingChoice(null)
  }

  const handleCreatePage = async () => {
    try {
      const response = await fetch('/api/editor/page/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: story.id,
          ...newPageForm
        })
      })

      if (response.ok) {
        await onDataChange?.()
        setShowPageForm(false)
        setNewPageForm({
          pageNumber: Math.max(...story.pages.map(p => p.pageNumber), 0) + 2,
          title: '',
          content: '',
          isStartPage: false,
          imageUrl: null
        })
      } else {
        alert('Erreur lors de la création de la page')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création de la page')
    }
  }

  const handleImageUpload = async (file: File, pageId?: number) => {
    if (!file) return null

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pageId', (pageId || 0).toString())

      const response = await fetch('/api/editor/upload-image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        return result.imageUrl
      } else {
        alert(result.error || 'Erreur lors de l\'upload')
        return null
      }
    } catch (error) {
      console.error('Erreur upload:', error)
      alert('Erreur lors de l\'upload de l\'image')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCreateChoice = async () => {
    if (!selectedPage) {
      alert('Aucune page sélectionnée')
      return
    }

    if (!newChoiceForm.text.trim()) {
      alert('Le texte du choix est obligatoire')
      return
    }

    try {
      // Construire les données du choix
      const choiceData: any = {
        pageId: selectedPage.id,
        text: newChoiceForm.text,
        targetPageId: newChoiceForm.targetPageId
      }

      // Tests simples avec dés
      if (newChoiceForm.diceRequired && newChoiceForm.diceTarget) {
        choiceData.diceRequired = newChoiceForm.diceRequired
        choiceData.diceTarget = newChoiceForm.diceTarget
      }

      // Tests avec stats
      if (newChoiceForm.statType && newChoiceForm.statValue) {
        choiceData.statsRequired = JSON.stringify({
          [newChoiceForm.statType]: newChoiceForm.statValue
        })
      }

      // Gestion des échecs
      if (newChoiceForm.failureType) {
        choiceData.failureType = newChoiceForm.failureType
        choiceData.allowRetry = newChoiceForm.allowRetry
        
        if (newChoiceForm.failureType === 'combat' || newChoiceForm.failureType === 'trap') {
          choiceData.failureDamage = newChoiceForm.failureDamage || 2
          if (newChoiceForm.allowRetry && newChoiceForm.retryText) {
            choiceData.retryText = newChoiceForm.retryText
          }
        }
        
        if (newChoiceForm.failureType === 'puzzle' || newChoiceForm.failureType === 'social') {
          choiceData.failurePageId = newChoiceForm.failurePageId
        }
      }

      console.log('Données du choix à envoyer:', choiceData)
      
      const response = await fetch('/api/editor/choice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(choiceData)
      })

      console.log('Réponse API:', response.status, response.statusText)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Choix créé avec succès:', result)
        await onDataChange?.()
        setShowChoiceForm(false)
        resetChoiceForm()
      } else {
        const error = await response.json()
        console.error('Erreur API:', error)
        alert(`Erreur lors de la création du choix: ${error.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du choix')
    }
  }

  const handleEditChoice = (choice: Choice) => {
    // Remplir le formulaire avec les données du choix existant
    setNewChoiceForm({
      text: choice.text,
      targetPageId: choice.targetPageId,
      diceRequired: choice.diceRequired,
      diceTarget: choice.diceTarget,
      statType: choice.statsRequired ? Object.keys(JSON.parse(choice.statsRequired))[0] : '',
      statValue: choice.statsRequired ? Object.values(JSON.parse(choice.statsRequired))[0] as number : null,
      failureType: choice.failureType || '',
      failureDamage: choice.failureDamage,
      failurePageId: choice.failurePageId,
      allowRetry: choice.allowRetry || false,
      retryText: choice.retryText || ''
    })
    setEditingChoice(choice)
    setShowChoiceForm(true)
  }

  const handleUpdateChoice = async () => {
    if (!editingChoice) return

    try {
      // Construire les données du choix (même logique que la création)
      const choiceData: any = {
        text: newChoiceForm.text,
        targetPageId: newChoiceForm.targetPageId
      }

      // Tests simples avec dés
      if (newChoiceForm.diceRequired && newChoiceForm.diceTarget) {
        choiceData.diceRequired = newChoiceForm.diceRequired
        choiceData.diceTarget = newChoiceForm.diceTarget
      }

      // Tests avec stats
      if (newChoiceForm.statType && newChoiceForm.statValue) {
        choiceData.statsRequired = JSON.stringify({
          [newChoiceForm.statType]: newChoiceForm.statValue
        })
      }

      // Gestion des échecs
      if (newChoiceForm.failureType) {
        choiceData.failureType = newChoiceForm.failureType
        choiceData.allowRetry = newChoiceForm.allowRetry
        
        if (newChoiceForm.failureType === 'combat' || newChoiceForm.failureType === 'trap') {
          choiceData.failureDamage = newChoiceForm.failureDamage || 2
          if (newChoiceForm.allowRetry && newChoiceForm.retryText) {
            choiceData.retryText = newChoiceForm.retryText
          }
        }
        
        if (newChoiceForm.failureType === 'puzzle' || newChoiceForm.failureType === 'social') {
          choiceData.failurePageId = newChoiceForm.failurePageId
        }
      }

      const response = await fetch(`/api/editor/choice/${editingChoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(choiceData)
      })

      if (response.ok) {
        await onDataChange?.()
        setShowChoiceForm(false)
        resetChoiceForm()
      } else {
        const error = await response.json()
        alert(`Erreur lors de la mise à jour du choix: ${error.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du choix')
    }
  }

  const handleDeleteChoice = async (choiceId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce choix ?')) return

    try {
      const response = await fetch(`/api/editor/choice/${choiceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await onDataChange?.()
      } else {
        const error = await response.json()
        alert(`Erreur lors de la suppression: ${error.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression du choix')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Liste des pages */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Pages ({story.pages.length})</h3>
          <button
            onClick={() => setShowPageForm(true)}
            className="px-3 py-1 bg-green-600/70 hover:bg-green-600/90 rounded text-white text-sm"
          >
            + Ajouter
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {story.pages.map((page) => (
            <div
              key={page.id}
              onClick={() => setSelectedPage(page)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedPage?.id === page.id
                  ? 'bg-blue-600/30 border border-blue-400'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 font-mono text-sm">#{page.pageNumber}</span>
                    {page.isStartPage && <span className="text-green-400 text-xs">🏁 DÉBUT</span>}
                  </div>
                  <h4 className="text-white font-semibold text-sm">
                    {page.title || 'Sans titre'}
                  </h4>
                  <p className="text-blue-200 text-xs truncate">
                    {page.content.substring(0, 50)}...
                  </p>
                  <div className="text-blue-300 text-xs mt-1">
                    {page.choices.length} choix
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Éditeur de page sélectionnée */}
      <div className="lg:col-span-2 space-y-6">
        {selectedPage ? (
          <>
            {/* Contenu de la page */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  Page #{selectedPage.pageNumber}
                  {selectedPage.isStartPage && <span className="text-green-400 ml-2">🏁</span>}
                </h3>
                <button 
                  onClick={() => {
                    setEditingPage(selectedPage)
                    setShowEditPageForm(true)
                  }}
                  className="px-3 py-1 bg-blue-600/70 hover:bg-blue-600/90 rounded text-white text-sm"
                >
                  ✏️ Modifier
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">{selectedPage.title || 'Sans titre'}</h4>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <pre className="text-blue-100 text-sm whitespace-pre-wrap font-sans">
                    {selectedPage.content}
                  </pre>
                </div>
              </div>
            </div>

            {/* Choix de la page */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  Choix ({selectedPage.choices.length})
                </h3>
                <button
                  onClick={() => setShowChoiceForm(true)}
                  className="px-3 py-1 bg-green-600/70 hover:bg-green-600/90 rounded text-white text-sm"
                >
                  + Ajouter un choix
                </button>
              </div>

              <div className="space-y-3">
                {selectedPage.choices.map((choice) => (
                  <div key={choice.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white font-medium">{choice.text}</p>
                        
                        {/* Destination */}
                        <div className="text-blue-300 text-sm mt-1">
                          → Page {story.pages.find(p => p.id === choice.targetPageId)?.pageNumber || '?'}
                        </div>

                        {/* Tests */}
                        {choice.statsRequired && (
                          <div className="text-purple-300 text-sm">
                            🎲 Test: {Object.entries(JSON.parse(choice.statsRequired)).map(([stat, val]) => 
                              `${stat} ${val}+`).join(', ')}
                          </div>
                        )}

                        {choice.diceRequired && (
                          <div className="text-purple-300 text-sm">
                            🎲 Dé: {choice.diceTarget}+ sur {choice.diceRequired}d6
                          </div>
                        )}

                        {/* Échecs */}
                        {choice.failureType && (
                          <div className="text-red-300 text-sm">
                            💥 Échec ({choice.failureType}): 
                            {choice.failureDamage && ` ${choice.failureDamage} dégâts`}
                            {choice.failurePageId && ` → Page ${story.pages.find(p => p.id === choice.failurePageId)?.pageNumber}`}
                            {choice.allowRetry && ` (retry possible)`}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEditChoice(choice)}
                          className="px-2 py-1 bg-blue-600/50 hover:bg-blue-600/70 rounded text-white text-xs"
                          title="Modifier le choix"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteChoice(choice.id)}
                          className="px-2 py-1 bg-red-600/50 hover:bg-red-600/70 rounded text-white text-xs"
                          title="Supprimer le choix"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-12 shadow-xl text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-blue-200 text-lg">Sélectionnez une page pour l'éditer</p>
          </div>
        )}
      </div>

      {/* Modal nouvelle page */}
      {showPageForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Nouvelle Page</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Numéro de page</label>
                  <input
                    type="number"
                    value={newPageForm.pageNumber}
                    onChange={(e) => setNewPageForm({...newPageForm, pageNumber: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-blue-200">
                    <input
                      type="checkbox"
                      checked={newPageForm.isStartPage}
                      onChange={(e) => setNewPageForm({...newPageForm, isStartPage: e.target.checked})}
                    />
                    Page de départ
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Titre</label>
                <input
                  type="text"
                  value={newPageForm.title}
                  onChange={(e) => setNewPageForm({...newPageForm, title: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white"
                  placeholder="Titre de la page"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Contenu</label>
                <textarea
                  value={newPageForm.content}
                  onChange={(e) => setNewPageForm({...newPageForm, content: e.target.value})}
                  rows={8}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white resize-none"
                  placeholder="Écrivez le contenu de votre page ici..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Image (optionnelle)</label>
                <div className="space-y-3">
                  {newPageForm.imageUrl && (
                    <div className="relative">
                      <img 
                        src={newPageForm.imageUrl} 
                        alt="Aperçu" 
                        className="max-w-full h-32 object-cover rounded border border-white/20"
                      />
                      <button
                        onClick={() => setNewPageForm({...newPageForm, imageUrl: null})}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const imageUrl = await handleImageUpload(file)
                        if (imageUrl) {
                          setNewPageForm({...newPageForm, imageUrl})
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <p className="text-blue-300 text-sm">Upload en cours...</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPageForm(false)}
                className="px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleCreatePage}
                className="px-4 py-2 bg-green-600/70 hover:bg-green-600/90 rounded text-white"
              >
                Créer la page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal édition page */}
      {showEditPageForm && editingPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Modifier la page</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Titre</label>
                <input
                  type="text"
                  value={editingPage.title || ''}
                  onChange={(e) => setEditingPage({...editingPage, title: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white"
                  placeholder="Titre de la page"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Contenu</label>
                <textarea
                  value={editingPage.content}
                  onChange={(e) => setEditingPage({...editingPage, content: e.target.value})}
                  rows={10}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white resize-none"
                  placeholder="Écrivez le contenu de votre page ici..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Image (optionnelle)</label>
                <div className="space-y-3">
                  {editingPage.imageUrl && (
                    <div className="relative">
                      <img 
                        src={editingPage.imageUrl} 
                        alt="Aperçu" 
                        className="max-w-full h-32 object-cover rounded border border-white/20"
                      />
                      <button
                        onClick={() => setEditingPage({...editingPage, imageUrl: null})}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const imageUrl = await handleImageUpload(file, editingPage.id)
                        if (imageUrl) {
                          setEditingPage({...editingPage, imageUrl})
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <p className="text-blue-300 text-sm">Upload en cours...</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditPageForm(false)
                  setEditingPage(null)
                }}
                className="px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded text-white"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/editor/page/${editingPage.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: editingPage.title,
                        content: editingPage.content,
                        isStartPage: editingPage.isStartPage,
                        imageUrl: editingPage.imageUrl
                      })
                    })

                    if (response.ok) {
                      await onDataChange?.()
                      setShowEditPageForm(false)
                      setEditingPage(null)
                    } else {
                      alert('Erreur lors de la sauvegarde')
                    }
                  } catch (error) {
                    console.error('Erreur:', error)
                    alert('Erreur lors de la sauvegarde')
                  }
                }}
                className="px-4 py-2 bg-blue-600/70 hover:bg-blue-600/90 rounded text-white"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouveau choix */}
      {showChoiceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl my-8">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingChoice ? 'Modifier le choix' : 'Nouveau Choix'}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne 1: Choix de base */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-300">Configuration de base</h4>
                
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Texte du choix *</label>
                  <textarea
                    value={newChoiceForm.text}
                    onChange={(e) => setNewChoiceForm({...newChoiceForm, text: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white resize-none"
                    placeholder="Ex: Attaquer le monstre avec votre épée"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Page de destination</label>
                  <select
                    value={newChoiceForm.targetPageId || ''}
                    onChange={(e) => setNewChoiceForm({...newChoiceForm, targetPageId: parseInt(e.target.value) || null})}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white"
                  >
                    <option value="">Sélectionner une page...</option>
                    {story.pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        Page #{page.pageNumber} - {page.title || 'Sans titre'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tests */}
                <h5 className="text-md font-semibold text-green-300 mt-6">Tests requis (optionnel)</h5>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h6 className="text-sm font-medium text-blue-200 mb-3">Test avec caractéristique</h6>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newChoiceForm.statType}
                      onChange={(e) => setNewChoiceForm({...newChoiceForm, statType: e.target.value})}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                    >
                      <option value="">Aucun test</option>
                      <option value="strength">Force</option>
                      <option value="intelligence">Intelligence</option>
                      <option value="dexterity">Dextérité</option>
                      <option value="health">Vie</option>
                    </select>
                    <input
                      type="number"
                      value={newChoiceForm.statValue || ''}
                      onChange={(e) => setNewChoiceForm({...newChoiceForm, statValue: parseInt(e.target.value) || null})}
                      placeholder="Difficulté"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                    />
                  </div>
                  <p className="text-xs text-blue-300 mt-1">Le joueur lance 1d6 + sa caractéristique vs difficulté</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h6 className="text-sm font-medium text-blue-200 mb-3">Test de dé simple</h6>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={newChoiceForm.diceRequired || ''}
                      onChange={(e) => setNewChoiceForm({...newChoiceForm, diceRequired: parseInt(e.target.value) || null})}
                      placeholder="Nb de dés"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                    />
                    <input
                      type="number"
                      value={newChoiceForm.diceTarget || ''}
                      onChange={(e) => setNewChoiceForm({...newChoiceForm, diceTarget: parseInt(e.target.value) || null})}
                      placeholder="Résultat min"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                    />
                  </div>
                  <p className="text-xs text-blue-300 mt-1">Test de dé pur sans caractéristique</p>
                </div>
              </div>

              {/* Colonne 2: Gestion des échecs */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-red-300">Gestion des échecs</h4>
                
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Type d'échec</label>
                  <select
                    value={newChoiceForm.failureType}
                    onChange={(e) => setNewChoiceForm({...newChoiceForm, failureType: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded text-white"
                  >
                    <option value="">Pas d'échec spécial</option>
                    <option value="combat">Combat (dégâts + retry)</option>
                    <option value="trap">Piège (dégâts + retry)</option>
                    <option value="puzzle">Énigme (page alternative)</option>
                    <option value="social">Social (page alternative)</option>
                  </select>
                </div>

                {/* Options pour Combat/Piège */}
                {(newChoiceForm.failureType === 'combat' || newChoiceForm.failureType === 'trap') && (
                  <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-4">
                    <h6 className="text-sm font-semibold text-red-300 mb-3">Configuration Combat/Piège</h6>
                    
                    <div>
                      <label className="block text-xs text-blue-200 mb-1">Dégâts en cas d'échec</label>
                      <input
                        type="number"
                        value={newChoiceForm.failureDamage || ''}
                        onChange={(e) => setNewChoiceForm({...newChoiceForm, failureDamage: parseInt(e.target.value) || null})}
                        placeholder="2"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                      />
                    </div>

                    <div className="mt-3">
                      <label className="flex items-center gap-2 text-blue-200 text-sm">
                        <input
                          type="checkbox"
                          checked={newChoiceForm.allowRetry}
                          onChange={(e) => setNewChoiceForm({...newChoiceForm, allowRetry: e.target.checked})}
                        />
                        Permettre de réessayer
                      </label>
                    </div>

                    {newChoiceForm.allowRetry && (
                      <div className="mt-3">
                        <label className="block text-xs text-blue-200 mb-1">Texte pour retry</label>
                        <input
                          type="text"
                          value={newChoiceForm.retryText}
                          onChange={(e) => setNewChoiceForm({...newChoiceForm, retryText: e.target.value})}
                          placeholder="Ex: Continuer le combat ?"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Options pour Énigme/Social */}
                {(newChoiceForm.failureType === 'puzzle' || newChoiceForm.failureType === 'social') && (
                  <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4">
                    <h6 className="text-sm font-semibold text-purple-300 mb-3">Configuration Énigme/Social</h6>
                    
                    <div>
                      <label className="block text-xs text-blue-200 mb-1">Page en cas d'échec</label>
                      <select
                        value={newChoiceForm.failurePageId || ''}
                        onChange={(e) => setNewChoiceForm({...newChoiceForm, failurePageId: parseInt(e.target.value) || null})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                      >
                        <option value="">Sélectionner une page...</option>
                        {story.pages.map((page) => (
                          <option key={page.id} value={page.id}>
                            Page #{page.pageNumber} - {page.title || 'Sans titre'}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-blue-300 mt-1">Page vers laquelle rediriger en cas d'échec</p>
                    </div>
                  </div>
                )}

                {/* Aperçu */}
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                  <h6 className="text-sm font-semibold text-blue-300 mb-2">Aperçu</h6>
                  <div className="text-xs text-blue-200 space-y-1">
                    <div>Texte: "{newChoiceForm.text || 'Pas de texte'}"</div>
                    {newChoiceForm.targetPageId && (
                      <div>→ Page #{story.pages.find(p => p.id === newChoiceForm.targetPageId)?.pageNumber}</div>
                    )}
                    {newChoiceForm.statType && newChoiceForm.statValue && (
                      <div>🎲 Test: {newChoiceForm.statType} + dé vs {newChoiceForm.statValue}</div>
                    )}
                    {newChoiceForm.failureType && (
                      <div>💥 Échec: {newChoiceForm.failureType}
                        {newChoiceForm.failureDamage && ` (${newChoiceForm.failureDamage} dégâts)`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChoiceForm(false)
                  resetChoiceForm()
                }}
                className="px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded text-white"
              >
                Annuler
              </button>
              <button
                onClick={editingChoice ? handleUpdateChoice : handleCreateChoice}
                disabled={!newChoiceForm.text.trim()}
                className={`px-4 py-2 rounded text-white ${
                  !newChoiceForm.text.trim()
                    ? 'bg-gray-600/30 cursor-not-allowed'
                    : 'bg-green-600/70 hover:bg-green-600/90'
                }`}
              >
                {editingChoice ? 'Modifier' : 'Créer'} le choix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}