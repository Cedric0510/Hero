import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import LoginForm from '@/components/LoginForm'

export default async function HomePage() {
  const user = await getCurrentUser()
  
  // Si l'utilisateur est déjà connecté, rediriger vers la sélection de partie
  if (user) {
    redirect('/game-menu')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            📚 Gamebook Adventures
          </h1>
          <p className="text-blue-200">
            Vivez des aventures interactives épiques
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
