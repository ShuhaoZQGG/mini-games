'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Play, Pause, RefreshCw, Zap, Star, Trophy } from 'lucide-react'

interface Experiment {
  id: number
  name: string
  description: string
  type: 'pendulum' | 'projectile' | 'collision' | 'energy' | 'waves'
  variables: { name: string; min: number; max: number; default: number; unit: string }[]
  goal: string
  targetValue: number
  tolerance: number
}

const experiments: Experiment[] = [
  {
    id: 1,
    name: "Simple Pendulum",
    description: "Study the period of a pendulum",
    type: 'pendulum',
    variables: [
      { name: 'length', min: 0.5, max: 2, default: 1, unit: 'm' },
      { name: 'angle', min: 5, max: 45, default: 15, unit: '°' },
      { name: 'mass', min: 0.1, max: 1, default: 0.5, unit: 'kg' }
    ],
    goal: "Achieve a period of 2.0 seconds",
    targetValue: 2.0,
    tolerance: 0.1
  },
  {
    id: 2,
    name: "Projectile Motion",
    description: "Launch a projectile to hit a target",
    type: 'projectile',
    variables: [
      { name: 'velocity', min: 10, max: 50, default: 30, unit: 'm/s' },
      { name: 'angle', min: 0, max: 90, default: 45, unit: '°' },
      { name: 'height', min: 0, max: 10, default: 0, unit: 'm' }
    ],
    goal: "Hit the target at 50m distance",
    targetValue: 50,
    tolerance: 2
  },
  {
    id: 3,
    name: "Elastic Collision",
    description: "Study momentum conservation",
    type: 'collision',
    variables: [
      { name: 'mass1', min: 0.5, max: 5, default: 2, unit: 'kg' },
      { name: 'mass2', min: 0.5, max: 5, default: 1, unit: 'kg' },
      { name: 'velocity1', min: 0, max: 10, default: 5, unit: 'm/s' }
    ],
    goal: "Transfer maximum kinetic energy",
    targetValue: 0.9,
    tolerance: 0.05
  },
  {
    id: 4,
    name: "Energy Conservation",
    description: "Convert potential to kinetic energy",
    type: 'energy',
    variables: [
      { name: 'height', min: 1, max: 20, default: 10, unit: 'm' },
      { name: 'mass', min: 0.5, max: 5, default: 1, unit: 'kg' },
      { name: 'friction', min: 0, max: 0.5, default: 0.1, unit: 'μ' }
    ],
    goal: "Achieve 100 J of kinetic energy",
    targetValue: 100,
    tolerance: 5
  },
  {
    id: 5,
    name: "Wave Interference",
    description: "Create constructive interference",
    type: 'waves',
    variables: [
      { name: 'frequency1', min: 1, max: 10, default: 5, unit: 'Hz' },
      { name: 'frequency2', min: 1, max: 10, default: 5, unit: 'Hz' },
      { name: 'phase', min: 0, max: 360, default: 0, unit: '°' }
    ],
    goal: "Maximize amplitude at x=10",
    targetValue: 2,
    tolerance: 0.1
  }
]

const ScienceLab: React.FC = () => {
  const [currentExperiment, setCurrentExperiment] = useState(0)
  const [variables, setVariables] = useState<number[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [completedExperiments, setCompletedExperiments] = useState<number[]>([])
  const [attempts, setAttempts] = useState(0)
  const [animationTime, setAnimationTime] = useState(0)
  const [message, setMessage] = useState('Adjust variables and run the experiment!')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const exp = experiments[currentExperiment]
    setVariables(exp.variables.map(v => v.default))
    setResult(null)
    setIsRunning(false)
    setAnimationTime(0)
  }, [currentExperiment])

  useEffect(() => {
    if (isRunning) {
      const animate = () => {
        setAnimationTime(prev => prev + 0.016)
        drawExperiment()
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRunning, animationTime, variables])

  const drawExperiment = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const exp = experiments[currentExperiment]
    
    switch (exp.type) {
      case 'pendulum':
        drawPendulum(ctx, canvas, variables, animationTime)
        break
      case 'projectile':
        drawProjectile(ctx, canvas, variables, animationTime)
        break
      case 'collision':
        drawCollision(ctx, canvas, variables, animationTime)
        break
      case 'energy':
        drawEnergy(ctx, canvas, variables, animationTime)
        break
      case 'waves':
        drawWaves(ctx, canvas, variables, animationTime)
        break
    }
  }

  const drawPendulum = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, vars: number[], time: number) => {
    const [length, angle, mass] = vars
    const scale = 100
    const centerX = canvas.width / 2
    const centerY = 50
    
    // Calculate pendulum position
    const g = 9.81
    const omega = Math.sqrt(g / length)
    const currentAngle = (angle * Math.PI / 180) * Math.cos(omega * time)
    
    const bobX = centerX + length * scale * Math.sin(currentAngle)
    const bobY = centerY + length * scale * Math.cos(currentAngle)
    
    // Draw string
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(bobX, bobY)
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Draw bob
    ctx.beginPath()
    ctx.arc(bobX, bobY, 10 + mass * 10, 0, Math.PI * 2)
    ctx.fillStyle = '#3b82f6'
    ctx.fill()
    
    // Draw pivot
    ctx.beginPath()
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#666'
    ctx.fill()
  }

  const drawProjectile = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, vars: number[], time: number) => {
    const [velocity, angle, height] = vars
    const angleRad = angle * Math.PI / 180
    const g = 9.81
    const scale = 5
    
    // Calculate position
    const x = velocity * Math.cos(angleRad) * time * scale
    const y = canvas.height - height * scale - (velocity * Math.sin(angleRad) * time - 0.5 * g * time * time) * scale
    
    // Draw trajectory
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    for (let t = 0; t <= time; t += 0.01) {
      const px = velocity * Math.cos(angleRad) * t * scale
      const py = canvas.height - height * scale - (velocity * Math.sin(angleRad) * t - 0.5 * g * t * t) * scale
      
      if (t === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
      
      if (py > canvas.height) break
    }
    ctx.stroke()
    
    // Draw projectile
    if (y <= canvas.height && x <= canvas.width) {
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#ef4444'
      ctx.fill()
    }
    
    // Draw target
    ctx.fillStyle = '#10b981'
    ctx.fillRect(250, canvas.height - 20, 10, 20)
  }

  const drawCollision = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, vars: number[], time: number) => {
    const [mass1, mass2, velocity1] = vars
    const startX1 = 100
    const startX2 = 300
    const y = canvas.height / 2
    
    // Simple collision at t=1
    let x1, x2, v1, v2
    
    if (time < 1) {
      x1 = startX1 + velocity1 * 50 * time
      x2 = startX2
      v1 = velocity1
      v2 = 0
    } else {
      // After collision (elastic)
      v1 = ((mass1 - mass2) / (mass1 + mass2)) * velocity1
      v2 = (2 * mass1 / (mass1 + mass2)) * velocity1
      
      x1 = startX1 + velocity1 * 50 + v1 * 50 * (time - 1)
      x2 = startX2 + v2 * 50 * (time - 1)
    }
    
    // Draw masses
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(x1, y, 10 + mass1 * 3, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(x2, y, 10 + mass2 * 3, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw velocities
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x1, y)
    ctx.lineTo(x1 + (time < 1 ? v1 : v1) * 20, y)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(x2, y)
    ctx.lineTo(x2 + (time < 1 ? v2 : v2) * 20, y)
    ctx.stroke()
  }

  const drawEnergy = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, vars: number[], time: number) => {
    const [height, mass, friction] = vars
    const g = 9.81
    const scale = 10
    
    // Calculate position on ramp
    const rampAngle = Math.PI / 4
    const acceleration = g * Math.sin(rampAngle) * (1 - friction)
    const distance = 0.5 * acceleration * time * time
    const maxDistance = height / Math.sin(rampAngle)
    
    let x, y
    if (distance < maxDistance) {
      x = 100 + distance * Math.cos(rampAngle) * scale
      y = 100 + distance * Math.sin(rampAngle) * scale
    } else {
      // On flat surface
      const remainingTime = time - Math.sqrt(2 * maxDistance / acceleration)
      const finalVelocity = Math.sqrt(2 * acceleration * maxDistance)
      x = 100 + maxDistance * Math.cos(rampAngle) * scale + finalVelocity * remainingTime * scale
      y = 100 + height * scale
    }
    
    // Draw ramp
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(100, 100)
    ctx.lineTo(100 + height * scale, 100 + height * scale)
    ctx.lineTo(canvas.width, 100 + height * scale)
    ctx.stroke()
    
    // Draw mass
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(x - 10, y - 10, 20, 20)
    
    // Draw energy bars
    const potentialEnergy = mass * g * (height - (y - 100) / scale)
    const kineticEnergy = mass * g * height - potentialEnergy - friction * mass * g * distance
    
    ctx.fillStyle = '#10b981'
    ctx.fillRect(20, 20, 30, potentialEnergy * 2)
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(60, 20, 30, Math.max(0, kineticEnergy * 2))
  }

  const drawWaves = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, vars: number[], time: number) => {
    const [freq1, freq2, phase] = vars
    const phaseRad = phase * Math.PI / 180
    
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    for (let x = 0; x < canvas.width; x++) {
      const wave1 = Math.sin(2 * Math.PI * freq1 * (x / 100 - time))
      const wave2 = Math.sin(2 * Math.PI * freq2 * (x / 100 - time) + phaseRad)
      const y = canvas.height / 2 + (wave1 + wave2) * 30
      
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    
    // Draw individual waves (faded)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
    ctx.lineWidth = 1
    
    // Wave 1
    ctx.beginPath()
    for (let x = 0; x < canvas.width; x++) {
      const y = canvas.height / 2 + Math.sin(2 * Math.PI * freq1 * (x / 100 - time)) * 30
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    
    // Wave 2
    ctx.beginPath()
    for (let x = 0; x < canvas.width; x++) {
      const y = canvas.height / 2 + Math.sin(2 * Math.PI * freq2 * (x / 100 - time) + phaseRad) * 30
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const runExperiment = () => {
    setIsRunning(true)
    setAnimationTime(0)
    setAttempts(attempts + 1)
    
    // Calculate result based on experiment type
    setTimeout(() => {
      const exp = experiments[currentExperiment]
      let calculatedResult = 0
      
      switch (exp.type) {
        case 'pendulum':
          // Period = 2π√(L/g)
          calculatedResult = 2 * Math.PI * Math.sqrt(variables[0] / 9.81)
          break
        case 'projectile':
          // Range = v²sin(2θ)/g
          const angleRad = variables[1] * Math.PI / 180
          calculatedResult = (variables[0] * variables[0] * Math.sin(2 * angleRad)) / 9.81
          break
        case 'collision':
          // Energy transfer efficiency
          const v2After = (2 * variables[0] / (variables[0] + variables[1])) * variables[2]
          calculatedResult = (0.5 * variables[1] * v2After * v2After) / (0.5 * variables[0] * variables[2] * variables[2])
          break
        case 'energy':
          // Final kinetic energy
          calculatedResult = variables[1] * 9.81 * variables[0] * (1 - variables[2])
          break
        case 'waves':
          // Amplitude at specific point
          if (Math.abs(variables[0] - variables[1]) < 0.1 && Math.abs(variables[2]) < 10) {
            calculatedResult = 2
          } else {
            calculatedResult = Math.abs(Math.cos(variables[2] * Math.PI / 180))
          }
          break
      }
      
      setResult(calculatedResult)
      
      // Check if goal is achieved
      if (Math.abs(calculatedResult - exp.targetValue) <= exp.tolerance) {
        const points = 50 + Math.floor((1 - Math.abs(calculatedResult - exp.targetValue) / exp.tolerance) * 50)
        setScore(score + points)
        setMessage(`Success! Goal achieved! +${points} points`)
        setCompletedExperiments([...completedExperiments, currentExperiment])
      } else {
        setMessage(`Result: ${calculatedResult.toFixed(2)}. Target: ${exp.targetValue}. Keep trying!`)
      }
      
      setIsRunning(false)
    }, 3000)
  }

  const reset = () => {
    setCurrentExperiment(0)
    setScore(0)
    setCompletedExperiments([])
    setAttempts(0)
    setMessage('Adjust variables and run the experiment!')
  }

  const handleVariableChange = (index: number, value: number) => {
    const newVars = [...variables]
    newVars[index] = value
    setVariables(newVars)
  }

  // Calculate star rating based on performance
  const getStarRating = () => {
    const completionRate = completedExperiments.length / experiments.length
    const avgAttempts = attempts / Math.max(1, completedExperiments.length)
    
    if (completionRate >= 0.8 && avgAttempts <= 2) return 3
    if (completionRate >= 0.5 && avgAttempts <= 3) return 2
    if (completionRate >= 0.3) return 1
    return 0
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Science Lab</CardTitle>
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Score: {score}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Experiments: {completedExperiments.length}/{experiments.length}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex gap-1">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      getStarRating() >= star
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <Button onClick={reset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-1" />
                New Game
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Experiment Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Experiment: {experiments[currentExperiment].name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {experiments[currentExperiment].description}
              </p>
              
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <div className="font-semibold text-blue-900">Goal:</div>
                <div className="text-blue-700">{experiments[currentExperiment].goal}</div>
              </div>
              
              <div className="space-y-4">
                {experiments[currentExperiment].variables.map((variable, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium mb-1">
                      {variable.name}: {variables[index]?.toFixed(1)} {variable.unit}
                    </label>
                    <input
                      type="range"
                      min={variable.min}
                      max={variable.max}
                      step={(variable.max - variable.min) / 100}
                      value={variables[index] || variable.default}
                      onChange={(e) => handleVariableChange(index, parseFloat(e.target.value))}
                      className="w-full"
                      disabled={isRunning}
                    />
                  </div>
                ))}
              </div>
              
              {result !== null && (
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <div className="font-semibold">Result:</div>
                  <div className="text-2xl">
                    {result.toFixed(2)} 
                    {experiments[currentExperiment].type === 'pendulum' && ' s'}
                    {experiments[currentExperiment].type === 'projectile' && ' m'}
                    {experiments[currentExperiment].type === 'energy' && ' J'}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={runExperiment} 
                  disabled={isRunning}
                  className="flex-1"
                >
                  {isRunning ? (
                    <><Pause className="mr-2" /> Running...</>
                  ) : (
                    <><Play className="mr-2" /> Run Experiment</>
                  )}
                </Button>
                
                <Button 
                  onClick={() => {
                    const exp = experiments[currentExperiment]
                    setVariables(exp.variables.map(v => v.default))
                  }} 
                  variant="outline"
                >
                  <RefreshCw className="mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                width={500}
                height={300}
                className="w-full border rounded bg-gray-50"
              />
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-gray-100 rounded">
                  <div className="font-semibold">Completed:</div>
                  <div>{completedExperiments.length}/{experiments.length}</div>
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <div className="font-semibold">Score:</div>
                  <div>{score}</div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                {experiments.map((exp, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={index === currentExperiment ? 'default' : 'outline'}
                    onClick={() => setCurrentExperiment(index)}
                    disabled={isRunning}
                    className={completedExperiments.includes(index) ? 'bg-green-100' : ''}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-600">
                {message}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}

export default ScienceLab