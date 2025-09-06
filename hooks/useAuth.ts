/**
 * useAuth Hook
 * Simple authentication hook for demo purposes
 */

import { useState, useEffect, createContext, useContext } from 'react'

interface User {
  id: string
  username: string
  email?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (username: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Return a mock implementation for demo
    return {
      user: null,
      isLoading: false,
      signIn: async () => {},
      signOut: async () => {}
    }
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const signIn = async (username: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      username
    }
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}