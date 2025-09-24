'use client'

import { useState, useEffect } from 'react'
import { UserRole } from '@/lib/auth'

interface User {
  id: number
  email: string
  username: string
  role: UserRole
  createdAt: string
  _count: {
    gameSessions: number
  }
}

interface AdminClientProps {
  currentUser: {
    id: number
    email: string
    username: string
    role: UserRole
  }
}

const roleLabels = {
  ADMIN: 'Administrateur',
  AUTHOR: 'Auteur',
  PLAYER: 'Joueur'
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800',
  AUTHOR: 'bg-blue-100 text-blue-800',
  PLAYER: 'bg-green-100 text-green-800'
}

export default function AdminClient({ currentUser }: AdminClientProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: number, newRole: UserRole) => {
    setUpdating(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: updatedUser.role } : user
        ))
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      alert('Erreur lors de la mise à jour du rôle')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900">Total Utilisateurs</h3>
            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900">Auteurs</h3>
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.role === 'AUTHOR' || u.role === 'ADMIN').length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900">Administrateurs</h3>
            <p className="text-2xl font-bold text-red-600">
              {users.filter(u => u.role === 'ADMIN').length}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle Actuel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sessions de Jeu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date d'inscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.username}
                      {user.id === currentUser.id && (
                        <span className="ml-2 text-xs text-blue-600">(Vous)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user._count.gameSessions}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                    disabled={updating === user.id}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                  >
                    <option value="PLAYER">Joueur</option>
                    <option value="AUTHOR">Auteur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                  {updating === user.id && (
                    <div className="mt-1">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun utilisateur trouvé</p>
        </div>
      )}
    </div>
  )
}