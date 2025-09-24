import { getCurrentUser } from '@/lib/session'
import { canManageUsers } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminClient from '@/components/AdminClient'

export default async function AdminPage() {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || !canManageUsers(currentUser.role)) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Administration - Gestion des Utilisateurs
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gérez les rôles et permissions des utilisateurs du système
            </p>
          </div>
          
          <AdminClient currentUser={currentUser} />
        </div>
      </div>
    </div>
  )
}