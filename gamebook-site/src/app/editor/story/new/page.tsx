import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import NewStoryForm from '@/components/NewStoryForm'

export default async function NewStoryPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">✨ Créer une Nouvelle Histoire</h1>
          <p className="text-blue-200">Commencez votre livre dont vous êtes le héros</p>
        </div>

        {/* Formulaire */}
        <NewStoryForm user={user} />
      </div>
    </div>
  )
}