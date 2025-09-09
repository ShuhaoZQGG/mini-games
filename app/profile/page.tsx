'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import UserProfileComponent from '@/components/profile/user-profile'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { User, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkUser()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-pulse">
                <div className="h-8 w-48 bg-muted rounded mx-auto mb-4" />
                <div className="h-4 w-64 bg-muted rounded mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // For authenticated users, show their profile
  if (user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <UserProfileComponent userId={user.id} isOwnProfile={true} />
      </div>
    )
  }

  // For guests, show guest profile or prompt to sign in
  const guestSessionId = typeof window !== 'undefined' ? localStorage.getItem('guest_session_id') : null

  if (guestSessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Guest Profile Notice */}
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">You&apos;re viewing a guest profile</p>
                    <p className="text-sm text-muted-foreground">
                      Sign in to save your progress permanently and unlock all features
                    </p>
                  </div>
                </div>
                <Link href="/auth/signin">
                  <Button>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Guest Profile */}
          <UserProfileComponent userId={guestSessionId} isOwnProfile={true} />
        </div>
      </div>
    )
  }

  // No user and no guest session
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-12 text-center space-y-6">
            <User className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-2xl font-bold mb-2">No Profile Found</h2>
              <p className="text-muted-foreground">
                Sign in to view your profile or play some games to create a guest profile
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/auth/signin" className="block">
                <Button className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  Browse Games
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}