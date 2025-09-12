'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Swords, Shield } from 'lucide-react'

type Territory = {
  id: number
  name: string
  owner: 'player' | 'ai'
  armies: number
  adjacent: number[]
}

const Risk: React.FC = () => {
  const [territories, setTerritories] = useState<Territory[]>([
    {id: 0, name: 'North America', owner: 'player', armies: 5, adjacent: [1, 2]},
    {id: 1, name: 'South America', owner: 'ai', armies: 3, adjacent: [0, 3]},
    {id: 2, name: 'Europe', owner: 'player', armies: 4, adjacent: [0, 3, 4]},
    {id: 3, name: 'Africa', owner: 'ai', armies: 3, adjacent: [1, 2, 4]},
    {id: 4, name: 'Asia', owner: 'player', armies: 6, adjacent: [2, 3, 5]},
    {id: 5, name: 'Australia', owner: 'ai', armies: 2, adjacent: [4]}
  ])
  const [selectedFrom, setSelectedFrom] = useState<number | null>(null)
  const [selectedTo, setSelectedTo] = useState<number | null>(null)
  const [phase, setPhase] = useState<'reinforce' | 'attack' | 'fortify'>('reinforce')
  const [reinforcements, setReinforcements] = useState(5)
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'ai'>('player')
  
  const rollDice = (count: number): number[] => {
    return Array(count).fill(0).map(() => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a)
  }
  
  const attack = useCallback(() => {
    if (selectedFrom === null || selectedTo === null) return
    
    const from = territories[selectedFrom]
    const to = territories[selectedTo]
    
    if (from.owner !== currentPlayer || to.owner === currentPlayer || from.armies <= 1) return
    if (!from.adjacent.includes(to.id)) return
    
    const attackDice = rollDice(Math.min(3, from.armies - 1))
    const defendDice = rollDice(Math.min(2, to.armies))
    
    let attackerLosses = 0
    let defenderLosses = 0
    
    for (let i = 0; i < Math.min(attackDice.length, defendDice.length); i++) {
      if (attackDice[i] > defendDice[i]) {
        defenderLosses++
      } else {
        attackerLosses++
      }
    }
    
    setTerritories(prev => prev.map(t => {
      if (t.id === from.id) {
        return {...t, armies: t.armies - attackerLosses}
      }
      if (t.id === to.id) {
        const newArmies = t.armies - defenderLosses
        if (newArmies <= 0) {
          return {...t, armies: from.armies - attackerLosses - 1, owner: currentPlayer}
        }
        return {...t, armies: newArmies}
      }
      return t
    }))
  }, [selectedFrom, selectedTo, territories, currentPlayer])
  
  const reinforce = (territoryId: number) => {
    if (reinforcements <= 0 || territories[territoryId].owner !== currentPlayer) return
    
    setTerritories(prev => prev.map(t => 
      t.id === territoryId ? {...t, armies: t.armies + 1} : t
    ))
    setReinforcements(reinforcements - 1)
    
    if (reinforcements === 1) {
      setPhase('attack')
    }
  }
  
  const endTurn = () => {
    setCurrentPlayer(currentPlayer === 'player' ? 'ai' : 'player')
    setPhase('reinforce')
    setReinforcements(5)
    setSelectedFrom(null)
    setSelectedTo(null)
  }
  
  const resetGame = () => {
    setTerritories([
      {id: 0, name: 'North America', owner: 'player', armies: 5, adjacent: [1, 2]},
      {id: 1, name: 'South America', owner: 'ai', armies: 3, adjacent: [0, 3]},
      {id: 2, name: 'Europe', owner: 'player', armies: 4, adjacent: [0, 3, 4]},
      {id: 3, name: 'Africa', owner: 'ai', armies: 3, adjacent: [1, 2, 4]},
      {id: 4, name: 'Asia', owner: 'player', armies: 6, adjacent: [2, 3, 5]},
      {id: 5, name: 'Australia', owner: 'ai', armies: 2, adjacent: [4]}
    ])
    setPhase('reinforce')
    setReinforcements(5)
    setCurrentPlayer('player')
  }
  
  const playerTerritories = territories.filter(t => t.owner === 'player').length
  const aiTerritories = territories.filter(t => t.owner === 'ai').length
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Risk</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <span>Player: {playerTerritories}</span>
            <span>AI: {aiTerritories}</span>
            <span>Phase: {phase}</span>
            {phase === 'reinforce' && <span>Armies: {reinforcements}</span>}
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map */}
          <div className="grid grid-cols-3 gap-2">
            {territories.map(t => (
              <Button
                key={t.id}
                variant={
                  selectedFrom === t.id ? "default" :
                  selectedTo === t.id ? "destructive" :
                  t.owner === 'player' ? "secondary" : "outline"
                }
                className="h-20 flex flex-col"
                onClick={() => {
                  if (phase === 'reinforce') {
                    reinforce(t.id)
                  } else if (phase === 'attack') {
                    if (t.owner === currentPlayer && t.armies > 1) {
                      setSelectedFrom(t.id)
                      setSelectedTo(null)
                    } else if (selectedFrom !== null && t.owner !== currentPlayer) {
                      setSelectedTo(t.id)
                    }
                  }
                }}
              >
                <span className="text-xs">{t.name}</span>
                <span className="text-2xl font-bold">{t.armies}</span>
                <span className="text-xs">{t.owner.toUpperCase()}</span>
              </Button>
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 justify-center">
            {phase === 'attack' && (
              <>
                <Button 
                  onClick={attack}
                  disabled={selectedFrom === null || selectedTo === null}
                >
                  <Swords className="w-4 h-4 mr-2" />
                  Attack
                </Button>
                <Button onClick={() => setPhase('fortify')} variant="outline">
                  End Attacks
                </Button>
              </>
            )}
            {phase === 'fortify' && (
              <Button onClick={endTurn}>End Turn</Button>
            )}
          </div>
          
          {(playerTerritories === 0 || aiTerritories === 0) && (
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {playerTerritories === 0 ? 'AI Wins!' : 'You Win!'}
              </h2>
              <Button onClick={resetGame} className="mt-4">Play Again</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Risk
