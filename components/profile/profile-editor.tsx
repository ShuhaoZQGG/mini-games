'use client'

import { useState, useRef } from 'react'
import { UserProfile, updateProfile, uploadAvatar } from '@/lib/services/profiles'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  Loader2, 
  Check,
  AlertCircle,
  Sun,
  Moon,
  Monitor,
  User,
  FileText,
  Palette,
  Camera
} from 'lucide-react'

interface ProfileEditorProps {
  profile: UserProfile
  onClose: () => void
  onSave: () => void
}

export default function ProfileEditor({ profile, onClose, onSave }: ProfileEditorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [themePreference, setThemePreference] = useState(profile.theme_preference || 'system')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setAvatarFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate username
      if (!username.trim()) {
        throw new Error('Username is required')
      }

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters')
      }

      if (username.length > 20) {
        throw new Error('Username must be less than 20 characters')
      }

      // Validate bio
      if (bio.length > 200) {
        throw new Error('Bio must be less than 200 characters')
      }

      let finalAvatarUrl = avatarUrl

      // Upload avatar if changed
      if (avatarFile) {
        const uploadResult = await uploadAvatar(profile.id, avatarFile)
        if (uploadResult.success && uploadResult.url) {
          finalAvatarUrl = uploadResult.url
        } else {
          throw new Error(uploadResult.error || 'Failed to upload avatar')
        }
      }

      // Update profile
      const updateResult = await updateProfile(profile.id, {
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatarUrl,
        theme_preference: themePreference as 'light' | 'dark' | 'system'
      })

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update profile')
      }

      setSuccess(true)
      
      // Apply theme preference immediately
      if (themePreference !== 'system') {
        document.documentElement.classList.toggle('dark', themePreference === 'dark')
      }

      // Close dialog after a short delay
      setTimeout(() => {
        onSave()
      }, 1000)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />
      case 'dark':
        return <Moon className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Profile Picture
            </Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={avatarPreview || avatarUrl || undefined} 
                  alt={username} 
                />
                <AvatarFallback className="text-lg">
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              {username.length}/20 characters
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              disabled={loading}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/200 characters
            </p>
          </div>

          {/* Theme Preference */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Theme Preference
            </Label>
            <RadioGroup
              value={themePreference}
              onValueChange={(value) => setThemePreference(value as 'light' | 'dark' | 'system')}
              disabled={loading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                  <Sun className="w-4 h-4" />
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="w-4 h-4" />
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                  <Monitor className="w-4 h-4" />
                  System
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Profile updated successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || success}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}