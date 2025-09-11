'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Hammer, Trash2, PlayCircle, StopCircle } from 'lucide-react'

interface BridgeBuilderProps {
  levelConfig: {
    budget: number
    gridSize: { width: number; height: number }
    startPoint: { x: number; y: number }
    endPoint: { x: number; y: number }
    obstacles: { x: number; y: number }[]
    weightLimit: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Simple Gap',
    difficulty: 'easy',
    config: {
      budget: 500,
      gridSize: { width: 12, height: 8 },
      startPoint: { x: 1, y: 4 },
      endPoint: { x: 10, y: 4 },
      obstacles: [],
      weightLimit: 100
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'River Crossing',
    difficulty: 'medium',
    config: {
      budget: 800,
      gridSize: { width: 14, height: 10 },
      startPoint: { x: 1, y: 5 },
      endPoint: { x: 12, y: 7 },
      obstacles: [{ x: 6, y: 8 }, { x: 7, y: 8 }],
      weightLimit: 150
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Mountain Pass',
    difficulty: 'hard',
    config: {
      budget: 1200,
      gridSize: { width: 16, height: 12 },
      startPoint: { x: 1, y: 3 },
      endPoint: { x: 14, y: 9 },
      obstacles: [{ x: 5, y: 6 }, { x: 6, y: 7 }, { x: 10, y: 5 }],
      weightLimit: 200
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Complex Canyon',
    difficulty: 'expert',
    config: {
      budget: 1500,
      gridSize: { width: 18, height: 14 },
      startPoint: { x: 1, y: 7 },
      endPoint: { x: 16, y: 4 },
      obstacles: [{ x: 4, y: 8 }, { x: 8, y: 10 }, { x: 12, y: 6 }, { x: 13, y: 7 }],
      weightLimit: 250
    },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Ultimate Challenge',
    difficulty: 'master',
    config: {
      budget: 2000,
      gridSize: { width: 20, height: 16 },
      startPoint: { x: 1, y: 8 },
      endPoint: { x: 18, y: 12 },
      obstacles: [{ x: 4, y: 9 }, { x: 5, y: 10 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 14, y: 11 }, { x: 15, y: 11 }],
      weightLimit: 300
    },
    requiredStars: 12
  }
]

type MaterialType = 'wood' | 'steel' | 'cable'
type NodeType = 'normal' | 'fixed' | 'start' | 'end'

interface Node {
  x: number
  y: number
  type: NodeType
  force: { x: number; y: number }
  velocity: { x: number; y: number }
  fixed: boolean
}

interface Beam {
  start: number
  end: number
  material: MaterialType
  stress: number
  broken: boolean
}

const MATERIALS = {
  wood: { cost: 10, strength: 50, weight: 5, color: 'bg-yellow-600' },
  steel: { cost: 20, strength: 100, weight: 10, color: 'bg-gray-500' },
  cable: { cost: 15, strength: 75, weight: 3, color: 'bg-blue-500' }
}

function BridgeBuilder({ levelConfig, onScore }: BridgeBuilderProps) {
  const { budget, gridSize, startPoint, endPoint, obstacles, weightLimit } = levelConfig
  const [nodes, setNodes] = useState<Node[]>([])
  const [beams, setBeams] = useState<Beam[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('wood')
  const [selectedNode, setSelectedNode] = useState<number | null>(null)
  const [spent, setSpent] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [testPassed, setTestPassed] = useState(false)
  const [testFailed, setTestFailed] = useState(false)
  const [score, setScore] = useState(0)
  const [vehicle, setVehicle] = useState<{ x: number; y: number } | null>(null)
  const animationRef = useRef<number | undefined>(undefined)

  // Initialize nodes
  const initializeNodes = useCallback(() => {
    const newNodes: Node[] = []
    
    // Add fixed nodes at start and end
    newNodes.push({
      x: startPoint.x,
      y: startPoint.y,
      type: 'start',
      force: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      fixed: true
    })
    
    newNodes.push({
      x: endPoint.x,
      y: endPoint.y,
      type: 'end',
      force: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      fixed: true
    })
    
    return newNodes
  }, [startPoint, endPoint])

  // Add a node
  const addNode = (x: number, y: number) => {
    if (isSimulating) return
    
    // Check if node already exists
    const exists = nodes.some(n => n.x === x && n.y === y)
    if (exists) return
    
    // Check if it's an obstacle
    const isObstacle = obstacles.some(o => o.x === x && o.y === y)
    if (isObstacle) return
    
    const newNode: Node = {
      x,
      y,
      type: 'normal',
      force: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      fixed: false
    }
    
    setNodes([...nodes, newNode])
  }

  // Remove a node
  const removeNode = (index: number) => {
    if (isSimulating) return
    
    const node = nodes[index]
    if (node.type === 'start' || node.type === 'end') return
    
    // Remove associated beams
    const newBeams = beams.filter(b => b.start !== index && b.end !== index)
    
    // Adjust beam indices
    const adjustedBeams = newBeams.map(b => ({
      ...b,
      start: b.start > index ? b.start - 1 : b.start,
      end: b.end > index ? b.end - 1 : b.end
    }))
    
    setBeams(adjustedBeams)
    setNodes(nodes.filter((_, i) => i !== index))
    
    // Recalculate cost
    calculateCost(adjustedBeams)
  }

  // Add a beam
  const addBeam = (startIndex: number, endIndex: number) => {
    if (isSimulating) return
    
    // Check if beam already exists
    const exists = beams.some(b => 
      (b.start === startIndex && b.end === endIndex) ||
      (b.start === endIndex && b.end === startIndex)
    )
    if (exists) return
    
    const newBeam: Beam = {
      start: startIndex,
      end: endIndex,
      material: selectedMaterial,
      stress: 0,
      broken: false
    }
    
    const newBeams = [...beams, newBeam]
    setBeams(newBeams)
    calculateCost(newBeams)
  }

  // Calculate total cost
  const calculateCost = (currentBeams: Beam[]) => {
    let total = 0
    currentBeams.forEach(beam => {
      const node1 = nodes[beam.start]
      const node2 = nodes[beam.end]
      if (node1 && node2) {
        const length = Math.sqrt(
          Math.pow(node2.x - node1.x, 2) + Math.pow(node2.y - node1.y, 2)
        )
        total += MATERIALS[beam.material].cost * length
      }
    })
    setSpent(Math.round(total))
  }

  // Handle node click
  const handleNodeClick = (index: number) => {
    if (isSimulating) return
    
    if (selectedNode === null) {
      setSelectedNode(index)
    } else {
      if (selectedNode !== index) {
        addBeam(selectedNode, index)
      }
      setSelectedNode(null)
    }
  }

  // Simulate physics
  const simulatePhysics = useCallback(() => {
    if (!isSimulating) return
    
    const dt = 0.016 // 60 FPS
    const gravity = 9.8
    const damping = 0.99
    
    // Update nodes
    const newNodes = nodes.map(node => {
      if (node.fixed) return node
      
      // Apply gravity
      const force = { x: 0, y: gravity * 10 }
      
      // Apply spring forces from beams
      beams.forEach(beam => {
        if (beam.broken) return
        
        const other = beam.start === nodes.indexOf(node) 
          ? nodes[beam.end] 
          : beam.end === nodes.indexOf(node) 
          ? nodes[beam.start] 
          : null
        
        if (other) {
          const dx = other.x - node.x
          const dy = other.y - node.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const restLength = distance // Assume current length is rest length
          const displacement = distance - restLength
          const springForce = displacement * 100
          
          force.x += (dx / distance) * springForce
          force.y += (dy / distance) * springForce
        }
      })
      
      // Update velocity and position
      const velocity = {
        x: (node.velocity.x + force.x * dt) * damping,
        y: (node.velocity.y + force.y * dt) * damping
      }
      
      return {
        ...node,
        x: node.x + velocity.x * dt,
        y: node.y + velocity.y * dt,
        velocity,
        force
      }
    })
    
    // Check beam stress
    const newBeams = beams.map(beam => {
      const node1 = newNodes[beam.start]
      const node2 = newNodes[beam.end]
      const dx = node2.x - node1.x
      const dy = node2.y - node1.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const stress = Math.abs(distance - 1) * 100
      
      return {
        ...beam,
        stress,
        broken: stress > MATERIALS[beam.material].strength
      }
    })
    
    setNodes(newNodes)
    setBeams(newBeams)
    
    // Move vehicle
    if (vehicle) {
      const newX = vehicle.x + 0.1
      if (newX >= endPoint.x) {
        setTestPassed(true)
        setIsSimulating(false)
        const finalScore = Math.max(0, 1000 + (budget - spent))
        setScore(finalScore)
        onScore(finalScore)
      } else {
        setVehicle({ x: newX, y: vehicle.y })
        
        // Check if vehicle falls
        const onBridge = checkVehicleOnBridge(newX, vehicle.y, newNodes, newBeams)
        if (!onBridge) {
          setTestFailed(true)
          setIsSimulating(false)
        }
      }
    }
    
    animationRef.current = requestAnimationFrame(simulatePhysics)
  }, [isSimulating, nodes, beams, vehicle, endPoint, budget, spent, onScore])

  // Check if vehicle is supported
  const checkVehicleOnBridge = (x: number, y: number, currentNodes: Node[], currentBeams: Beam[]) => {
    // Simplified check - vehicle is supported if there's a beam below it
    return currentBeams.some(beam => {
      if (beam.broken) return false
      const node1 = currentNodes[beam.start]
      const node2 = currentNodes[beam.end]
      
      // Check if vehicle is above the beam
      const minX = Math.min(node1.x, node2.x)
      const maxX = Math.max(node1.x, node2.x)
      const minY = Math.min(node1.y, node2.y)
      const maxY = Math.max(node1.y, node2.y)
      
      return x >= minX && x <= maxX && y >= minY - 1 && y <= maxY + 1
    })
  }

  // Start simulation
  const startSimulation = () => {
    if (spent > budget) return
    
    setIsSimulating(true)
    setTestPassed(false)
    setTestFailed(false)
    setVehicle({ x: startPoint.x, y: startPoint.y })
  }

  // Stop simulation
  const stopSimulation = () => {
    setIsSimulating(false)
    setVehicle(null)
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    // Reset nodes and beams
    setNodes(initializeNodes())
    setBeams(beams.map(b => ({ ...b, stress: 0, broken: false })))
  }

  // Start simulation loop
  useEffect(() => {
    if (isSimulating) {
      animationRef.current = requestAnimationFrame(simulatePhysics)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSimulating, simulatePhysics])

  const startGame = () => {
    setNodes(initializeNodes())
    setBeams([])
    setSpent(0)
    setSelectedNode(null)
    setGameStarted(true)
    setIsSimulating(false)
    setTestPassed(false)
    setTestFailed(false)
    setVehicle(null)
    setScore(0)
  }

  const resetBridge = () => {
    setNodes(initializeNodes())
    setBeams([])
    setSpent(0)
    setSelectedNode(null)
    setIsSimulating(false)
    setTestPassed(false)
    setTestFailed(false)
    setVehicle(null)
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Bridge Builder</h3>
            <p className="text-sm text-muted-foreground">
              Budget: ${spent} / ${budget}
            </p>
            <p className="text-sm text-muted-foreground">
              Weight Limit: {weightLimit} tons
            </p>
          </div>
          
          <div className="flex gap-2">
            {gameStarted && !isSimulating && (
              <>
                <Button 
                  onClick={startSimulation} 
                  disabled={spent > budget || beams.length === 0}
                  variant="default"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Test Bridge
                </Button>
                <Button onClick={resetBridge} variant="outline">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </>
            )}
            {isSimulating && (
              <Button onClick={stopSimulation} variant="destructive">
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Test
              </Button>
            )}
            {!gameStarted ? (
              <Button onClick={startGame} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            ) : (
              <Button onClick={startGame} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            )}
          </div>
        </div>

        {gameStarted && (
          <>
            {/* Material Selection */}
            <div className="mb-4 flex gap-2">
              {Object.entries(MATERIALS).map(([material, props]) => (
                <Button
                  key={material}
                  variant={selectedMaterial === material ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMaterial(material as MaterialType)}
                  disabled={isSimulating}
                >
                  <div className={`w-4 h-2 mr-2 ${props.color} rounded`} />
                  {material} (${props.cost}/m)
                </Button>
              ))}
            </div>

            {/* Building Area */}
            <div className="relative bg-sky-100 dark:bg-sky-900 rounded-lg overflow-hidden"
                 style={{ height: `${gridSize.height * 40}px` }}>
              <svg
                width={gridSize.width * 40}
                height={gridSize.height * 40}
                className="absolute inset-0"
              >
                {/* Grid */}
                {Array.from({ length: gridSize.width + 1 }, (_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * 40}
                    y1={0}
                    x2={i * 40}
                    y2={gridSize.height * 40}
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="1"
                  />
                ))}
                {Array.from({ length: gridSize.height + 1 }, (_, i) => (
                  <line
                    key={`h-${i}`}
                    x1={0}
                    y1={i * 40}
                    x2={gridSize.width * 40}
                    y2={i * 40}
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Beams */}
                {beams.map((beam, index) => {
                  const node1 = nodes[beam.start]
                  const node2 = nodes[beam.end]
                  if (!node1 || !node2) return null
                  
                  const material = MATERIALS[beam.material]
                  const color = beam.broken ? 'red' : 
                               beam.stress > material.strength * 0.8 ? 'orange' :
                               beam.stress > material.strength * 0.5 ? 'yellow' :
                               'brown'
                  
                  return (
                    <line
                      key={index}
                      x1={node1.x * 40}
                      y1={node1.y * 40}
                      x2={node2.x * 40}
                      y2={node2.y * 40}
                      stroke={color}
                      strokeWidth={beam.broken ? 2 : 4}
                      strokeDasharray={beam.broken ? '5,5' : undefined}
                      opacity={beam.broken ? 0.5 : 1}
                    />
                  )
                })}
                
                {/* Obstacles */}
                {obstacles.map((obstacle, index) => (
                  <rect
                    key={index}
                    x={obstacle.x * 40 - 15}
                    y={obstacle.y * 40 - 15}
                    width={30}
                    height={30}
                    fill="gray"
                    opacity={0.7}
                  />
                ))}
              </svg>
              
              {/* Nodes */}
              {nodes.map((node, index) => (
                <motion.button
                  key={index}
                  className={`absolute w-6 h-6 rounded-full ${
                    node.type === 'start' ? 'bg-green-500' :
                    node.type === 'end' ? 'bg-red-500' :
                    selectedNode === index ? 'bg-blue-500' :
                    'bg-gray-600'
                  } ${!isSimulating && node.type === 'normal' ? 'hover:scale-110' : ''}`}
                  style={{
                    left: `${node.x * 40 - 12}px`,
                    top: `${node.y * 40 - 12}px`
                  }}
                  onClick={() => handleNodeClick(index)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    removeNode(index)
                  }}
                  disabled={isSimulating}
                  whileHover={!isSimulating ? { scale: 1.2 } : {}}
                  whileTap={!isSimulating ? { scale: 0.9 } : {}}
                />
              ))}
              
              {/* Grid click areas for adding nodes */}
              {!isSimulating && Array.from({ length: gridSize.width }, (_, x) =>
                Array.from({ length: gridSize.height }, (_, y) => {
                  const exists = nodes.some(n => n.x === x && n.y === y)
                  const isObstacle = obstacles.some(o => o.x === x && o.y === y)
                  if (exists || isObstacle) return null
                  
                  return (
                    <button
                      key={`${x}-${y}`}
                      className="absolute w-10 h-10 opacity-0 hover:opacity-20 bg-blue-500 rounded"
                      style={{
                        left: `${x * 40 - 5}px`,
                        top: `${y * 40 - 5}px`
                      }}
                      onClick={() => addNode(x, y)}
                    />
                  )
                })
              )}
              
              {/* Vehicle */}
              {vehicle && (
                <motion.div
                  className="absolute w-8 h-6 bg-orange-500 rounded"
                  style={{
                    left: `${vehicle.x * 40 - 16}px`,
                    top: `${vehicle.y * 40 - 12}px`
                  }}
                  initial={{ x: 0 }}
                  animate={{ x: vehicle.x * 40 }}
                />
              )}
              
              {/* Result overlay */}
              {(testPassed || testFailed) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center"
                  >
                    <h2 className="text-2xl font-bold mb-2">
                      {testPassed ? 'Bridge Successful!' : 'Bridge Failed!'}
                    </h2>
                    {testPassed && (
                      <>
                        <p className="text-lg mb-2">Score: {score}</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Budget saved: ${budget - spent}
                        </p>
                      </>
                    )}
                    <Button onClick={stopSimulation}>
                      <Hammer className="w-4 h-4 mr-2" />
                      Continue Building
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Click grid points to add nodes, click nodes to connect with beams</p>
              <p>Right-click nodes to remove them. Test your bridge when ready!</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function BridgeBuilderWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const maxScore = 1000 + levelConfig.budget
    const percentage = (score / maxScore) * 100
    if (percentage >= 70) return 3
    if (percentage >= 40) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="bridge-builder"
      gameName="Bridge Builder"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <BridgeBuilder levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}