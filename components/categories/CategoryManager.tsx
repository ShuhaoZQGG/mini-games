'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Save, 
  Sparkles, 
  Layers, 
  Grid3x3,
  AlertCircle,
  CheckCircle,
  Zap,
  Tag,
  Plus,
  Minus,
  GripVertical,
  Search,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  GameCategory, 
  GameCategoryMapping,
  gameCategories,
  getAllCategories 
} from '@/lib/gameCategories'

interface CategoryWeight {
  category: GameCategory
  relevance: number
}

interface GameCategoryEdit {
  game: GameCategoryMapping
  categories: CategoryWeight[]
  isDirty: boolean
}

interface CategoryManagerProps {
  isAdmin?: boolean
  className?: string
}

export function CategoryManager({ isAdmin = false, className }: CategoryManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [editedGames, setEditedGames] = useState<Map<string, GameCategoryEdit>>(new Map())
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [draggedGame, setDraggedGame] = useState<string | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<GameCategory | null>(null)

  const categories = getAllCategories() as GameCategory[]
  
  // Filter games based on search
  const filteredGames = gameCategories.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle category weight change
  const handleWeightChange = (gameId: string, category: GameCategory, relevance: number) => {
    const game = gameCategories.find(g => g.id === gameId)
    if (!game) return

    const currentEdit = editedGames.get(gameId) || {
      game,
      categories: game.categories || [{ category: game.category, relevance: 100 }],
      isDirty: false
    }

    const updatedCategories = currentEdit.categories.map(c =>
      c.category === category ? { ...c, relevance } : c
    )

    setEditedGames(new Map(editedGames.set(gameId, {
      ...currentEdit,
      categories: updatedCategories,
      isDirty: true
    })))
  }

  // Add category to game
  const addCategoryToGame = (gameId: string, category: GameCategory) => {
    const game = gameCategories.find(g => g.id === gameId)
    if (!game) return

    const currentEdit = editedGames.get(gameId) || {
      game,
      categories: game.categories || [{ category: game.category, relevance: 100 }],
      isDirty: false
    }

    // Check if category already exists
    if (currentEdit.categories.some(c => c.category === category)) return

    setEditedGames(new Map(editedGames.set(gameId, {
      ...currentEdit,
      categories: [...currentEdit.categories, { category, relevance: 50 }],
      isDirty: true
    })))
  }

  // Remove category from game
  const removeCategoryFromGame = (gameId: string, category: GameCategory) => {
    const currentEdit = editedGames.get(gameId)
    if (!currentEdit) return

    // Don't remove if it's the only category
    if (currentEdit.categories.length <= 1) return

    setEditedGames(new Map(editedGames.set(gameId, {
      ...currentEdit,
      categories: currentEdit.categories.filter(c => c.category !== category),
      isDirty: true
    })))
  }

  // Bulk operations
  const bulkAddCategory = (category: GameCategory, relevance: number = 50) => {
    selectedGames.forEach(gameId => {
      addCategoryToGame(gameId, category)
    })
  }

  const bulkUpdateRelevance = (delta: number) => {
    selectedGames.forEach(gameId => {
      const currentEdit = editedGames.get(gameId)
      if (!currentEdit) return

      const updatedCategories = currentEdit.categories.map(c => ({
        ...c,
        relevance: Math.max(0, Math.min(100, c.relevance + delta))
      }))

      setEditedGames(new Map(editedGames.set(gameId, {
        ...currentEdit,
        categories: updatedCategories,
        isDirty: true
      })))
    })
  }

  // Auto-suggest categories based on tags and description
  const autoSuggestCategories = (game: GameCategoryMapping): CategoryWeight[] => {
    const suggestions: CategoryWeight[] = []
    
    // Primary category always has high relevance
    suggestions.push({ category: game.category, relevance: 100 })
    
    // Analyze tags for category suggestions
    const categoryKeywords: Record<GameCategory, string[]> = {
      'puzzle': ['puzzle', 'logic', 'brain', 'solve'],
      'action': ['action', 'fast', 'reflex', 'quick', 'speed'],
      'strategy': ['strategy', 'plan', 'tactical', 'chess'],
      'arcade': ['arcade', 'classic', 'retro'],
      'card': ['card', 'deck', 'poker', 'solitaire'],
      'memory': ['memory', 'remember', 'match', 'pattern'],
      'skill': ['skill', 'accuracy', 'precision', 'timing'],
      'casino': ['casino', 'gamble', 'bet', 'luck'],
      'word': ['word', 'letter', 'vocabulary', 'spell'],
      'music': ['music', 'rhythm', 'beat', 'sound'],
      'physics': ['physics', 'gravity', 'momentum', 'force'],
      'simulation': ['simulation', 'sim', 'manage', 'build']
    }
    
    // Check tags and description for keyword matches
    Object.entries(categoryKeywords).forEach(([cat, keywords]) => {
      const category = cat as GameCategory
      if (category === game.category) return // Skip primary category
      
      let relevance = 0
      keywords.forEach(keyword => {
        if (game.tags.some(tag => tag.toLowerCase().includes(keyword))) {
          relevance += 30
        }
        if (game.description.toLowerCase().includes(keyword)) {
          relevance += 20
        }
      })
      
      if (relevance > 0) {
        suggestions.push({ category, relevance: Math.min(80, relevance) })
      }
    })
    
    return suggestions
  }

  // Apply auto-suggestions
  const applyAutoSuggestions = () => {
    const updates = new Map(editedGames)
    
    filteredGames.forEach(game => {
      const suggestions = autoSuggestCategories(game)
      updates.set(game.id, {
        game,
        categories: suggestions,
        isDirty: true
      })
    })
    
    setEditedGames(updates)
    setShowPreview(true)
  }

  // Save changes
  const saveChanges = async () => {
    setIsSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In a real app, this would make an API call to save to database
    const dirtyGames = Array.from(editedGames.values()).filter(e => e.isDirty)
    
    if (dirtyGames.length > 0) {
      setSaveMessage({ 
        type: 'success', 
        text: `Successfully updated ${dirtyGames.length} game(s)` 
      })
      
      // Clear dirty flags
      const updates = new Map(editedGames)
      updates.forEach((value, key) => {
        updates.set(key, { ...value, isDirty: false })
      })
      setEditedGames(updates)
    } else {
      setSaveMessage({ 
        type: 'error', 
        text: 'No changes to save' 
      })
    }
    
    setIsSaving(false)
    setTimeout(() => setSaveMessage(null), 3000)
  }

  // Drag and drop handlers
  const handleDragStart = (gameId: string) => {
    setDraggedGame(gameId)
  }

  const handleDragOver = (e: React.DragEvent, category: GameCategory) => {
    e.preventDefault()
    setDragOverCategory(category)
  }

  const handleDrop = (e: React.DragEvent, category: GameCategory) => {
    e.preventDefault()
    if (draggedGame) {
      addCategoryToGame(draggedGame, category)
    }
    setDraggedGame(null)
    setDragOverCategory(null)
  }

  if (!isAdmin) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <Shield className="h-4 w-4" />
        <AlertTitle>Admin Access Required</AlertTitle>
        <AlertDescription>
          You need administrator privileges to access the Category Manager.
        </AlertDescription>
      </Alert>
    )
  }

  const dirtyCount = Array.from(editedGames.values()).filter(e => e.isDirty).length

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Category Manager</h2>
          <p className="text-muted-foreground">
            Manage game categories and relevance scores
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={applyAutoSuggestions}
            disabled={isSaving}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Suggest
          </Button>
          <Button
            onClick={saveChanges}
            disabled={isSaving || dirtyCount === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
            {dirtyCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {dirtyCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant={saveMessage.type === 'success' ? 'default' : 'destructive'}>
              {saveMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{saveMessage.text}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual Games</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Drop Zones */}
          <Card>
            <CardHeader>
              <CardTitle>Category Assignment</CardTitle>
              <CardDescription>
                Drag games to assign categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categories.map(category => (
                  <div
                    key={category}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-3 text-center transition-colors",
                      dragOverCategory === category && "border-primary bg-primary/5"
                    )}
                    onDragOver={(e) => handleDragOver(e, category)}
                    onDrop={(e) => handleDrop(e, category)}
                  >
                    <Badge variant="outline" className="mb-2">
                      {category}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      Drop games here
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Games List */}
          <div className="space-y-3">
            {filteredGames.slice(0, 20).map(game => {
              const edit = editedGames.get(game.id)
              const categories = edit?.categories || 
                game.categories || 
                [{ category: game.category, relevance: 100 }]
              
              return (
                <Card 
                  key={game.id}
                  className={cn(
                    "transition-all",
                    edit?.isDirty && "border-orange-500",
                    selectedGames.includes(game.id) && "bg-accent/5"
                  )}
                  draggable
                  onDragStart={() => handleDragStart(game.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <input
                          type="checkbox"
                          checked={selectedGames.includes(game.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGames([...selectedGames, game.id])
                            } else {
                              setSelectedGames(selectedGames.filter(id => id !== game.id))
                            }
                          }}
                          className="rounded"
                        />
                        <div>
                          <CardTitle className="text-base">{game.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {game.description}
                          </CardDescription>
                        </div>
                      </div>
                      {edit?.isDirty && (
                        <Badge variant="outline" className="text-xs">
                          Modified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categories.map(({ category, relevance }) => (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{category}</Badge>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleWeightChange(
                                  game.id, 
                                  category, 
                                  Math.max(0, relevance - 10)
                                )}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-12 text-center">
                                {relevance}%
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleWeightChange(
                                  game.id, 
                                  category, 
                                  Math.min(100, relevance + 10)
                                )}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              {categories.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => removeCategoryFromGame(game.id, category)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <Progress value={relevance} className="h-2" />
                        </div>
                      ))}
                      
                      {/* Add Category Button */}
                      <div className="pt-2">
                        <select
                          className="text-xs border rounded px-2 py-1"
                          onChange={(e) => {
                            if (e.target.value) {
                              addCategoryToGame(game.id, e.target.value as GameCategory)
                              e.target.value = ''
                            }
                          }}
                        >
                          <option value="">Add category...</option>
                          {getAllCategories()
                            .filter(cat => !categories.some(c => c.category === cat))
                            .map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
              <CardDescription>
                Apply changes to multiple games at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedGames.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Select games from the Individual Games tab to perform bulk operations
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {selectedGames.length} games selected
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedGames([])}
                    >
                      Clear selection
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Add Category to Selected Games</Label>
                      <div className="flex gap-2 mt-2">
                        <select className="flex-1 border rounded px-3 py-2">
                          <option value="">Select category...</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <Button
                          onClick={(e) => {
                            const select = e.currentTarget.previousElementSibling as HTMLSelectElement
                            if (select.value) {
                              bulkAddCategory(select.value as GameCategory)
                              select.value = ''
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Adjust Relevance Scores</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          onClick={() => bulkUpdateRelevance(-10)}
                        >
                          -10%
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => bulkUpdateRelevance(-5)}
                        >
                          -5%
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => bulkUpdateRelevance(5)}
                        >
                          +5%
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => bulkUpdateRelevance(10)}
                        >
                          +10%
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && dirtyCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Changes</CardTitle>
                <CardDescription>
                  Review auto-suggested categories before saving
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {Array.from(editedGames.values())
                    .filter(e => e.isDirty)
                    .slice(0, 10)
                    .map(({ game, categories }) => (
                      <div key={game.id} className="flex items-center justify-between p-2 bg-accent/5 rounded">
                        <span className="text-sm font-medium">{game.name}</span>
                        <div className="flex gap-1">
                          {categories.map(({ category, relevance }) => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category} ({relevance}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
                {dirtyCount > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    And {dirtyCount - 10} more...
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Add missing import
import { X } from 'lucide-react'