'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Cookie } from 'lucide-react'

const CookieClicker: React.FC = () => {
  const [cookies, setCookies] = useState(0)
  const [cps, setCps] = useState(0) // cookies per second
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [upgrades, setUpgrades] = useState({
    cursor: { count: 0, cost: 10, cps: 0.1 },
    grandma: { count: 0, cost: 100, cps: 1 },
    farm: { count: 0, cost: 1000, cps: 10 },
    factory: { count: 0, cost: 10000, cps: 100 }
  })
  const [clickPower, setClickPower] = useState(1)
  const [totalClicks, setTotalClicks] = useState(0)

  const clickCookie = () => {
    setCookies(prev => prev + clickPower)
    setTotalClicks(prev => prev + 1)
  }

  const buyUpgrade = (type: keyof typeof upgrades) => {
    const upgrade = upgrades[type]
    if (cookies >= upgrade.cost) {
      setCookies(prev => prev - upgrade.cost)
      setUpgrades(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          count: prev[type].count + 1,
          cost: Math.floor(prev[type].cost * 1.15)
        }
      }))
      setCps(prev => prev + upgrade.cps)
    }
  }

  const resetGame = () => {
    setCookies(0)
    setCps(0)
    setClickPower(1)
    setTotalClicks(0)
    setUpgrades({
      cursor: { count: 0, cost: 10, cps: 0.1 },
      grandma: { count: 0, cost: 100, cps: 1 },
      farm: { count: 0, cost: 1000, cps: 10 },
      factory: { count: 0, cost: 10000, cps: 100 }
    })
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCookies(prev => prev + cps)
    }, 1000)
    return () => clearInterval(interval)
  }, [cps])

  useEffect(() => {
    const newLevel = Math.floor(Math.log10(cookies + 1)) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(Math.min(stars + 1, 15))
      setClickPower(prev => prev + 1)
    }
  }, [cookies, level, stars])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Cookie className="w-6 h-6" />
          Cookie Clicker Evolution - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{Math.floor(cookies)} cookies</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/15</span>
            </div>
            <div className="text-sm">
              {cps.toFixed(1)} cookies/sec
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-center">
              <button
                onClick={clickCookie}
                className="text-8xl hover:scale-110 active:scale-95 transition-transform"
              >
                🍪
              </button>
              <p className="mt-2 text-sm text-gray-600">
                Click Power: {clickPower} | Total Clicks: {totalClicks}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Upgrades</h3>
            {Object.entries(upgrades).map(([type, upgrade]) => (
              <div key={type} className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="capitalize font-medium">{type}</span>
                    <span className="ml-2 text-sm">({upgrade.count})</span>
                    <div className="text-xs text-gray-600">
                      +{upgrade.cps} cookies/sec
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => buyUpgrade(type as keyof typeof upgrades)}
                    disabled={cookies < upgrade.cost}
                  >
                    {upgrade.cost} 🍪
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CookieClicker
