'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Play, CheckCircle, XCircle, Lightbulb, Star, Trophy } from 'lucide-react'

interface Puzzle {
  id: number
  title: string
  description: string
  initialCode: string
  solution: string
  testCases: { input: any[], expected: any }[]
  hints: string[]
  difficulty: number
}

const puzzles: Puzzle[] = [
  {
    id: 1,
    title: "Sum Two Numbers",
    description: "Write a function that returns the sum of two numbers.",
    initialCode: "function sum(a, b) {\n  // Your code here\n  \n}",
    solution: "function sum(a, b) {\n  return a + b;\n}",
    testCases: [
      { input: [2, 3], expected: 5 },
      { input: [10, -5], expected: 5 },
      { input: [0, 0], expected: 0 }
    ],
    hints: ["Use the + operator", "Return the result"],
    difficulty: 1
  },
  {
    id: 2,
    title: "Find Maximum",
    description: "Write a function that returns the maximum of three numbers.",
    initialCode: "function findMax(a, b, c) {\n  // Your code here\n  \n}",
    solution: "function findMax(a, b, c) {\n  return Math.max(a, b, c);\n}",
    testCases: [
      { input: [1, 2, 3], expected: 3 },
      { input: [5, 2, 8], expected: 8 },
      { input: [-1, -5, -3], expected: -1 }
    ],
    hints: ["Use Math.max()", "Or compare with if statements"],
    difficulty: 1
  },
  {
    id: 3,
    title: "Reverse String",
    description: "Write a function that reverses a string.",
    initialCode: "function reverseString(str) {\n  // Your code here\n  \n}",
    solution: "function reverseString(str) {\n  return str.split('').reverse().join('');\n}",
    testCases: [
      { input: ["hello"], expected: "olleh" },
      { input: ["world"], expected: "dlrow" },
      { input: ["a"], expected: "a" }
    ],
    hints: ["Split the string into an array", "Use the reverse() method"],
    difficulty: 2
  },
  {
    id: 4,
    title: "FizzBuzz",
    description: "Return 'Fizz' for multiples of 3, 'Buzz' for multiples of 5, 'FizzBuzz' for both, or the number.",
    initialCode: "function fizzBuzz(n) {\n  // Your code here\n  \n}",
    solution: "function fizzBuzz(n) {\n  if (n % 15 === 0) return 'FizzBuzz';\n  if (n % 3 === 0) return 'Fizz';\n  if (n % 5 === 0) return 'Buzz';\n  return n;\n}",
    testCases: [
      { input: [3], expected: "Fizz" },
      { input: [5], expected: "Buzz" },
      { input: [15], expected: "FizzBuzz" },
      { input: [7], expected: 7 }
    ],
    hints: ["Use the modulo operator %", "Check for 15 first"],
    difficulty: 2
  },
  {
    id: 5,
    title: "Palindrome Check",
    description: "Check if a string is a palindrome (reads same forwards and backwards).",
    initialCode: "function isPalindrome(str) {\n  // Your code here\n  \n}",
    solution: "function isPalindrome(str) {\n  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === clean.split('').reverse().join('');\n}",
    testCases: [
      { input: ["racecar"], expected: true },
      { input: ["hello"], expected: false },
      { input: ["A man a plan a canal Panama"], expected: true }
    ],
    hints: ["Clean the string first", "Compare with reversed version"],
    difficulty: 3
  },
  {
    id: 6,
    title: "Fibonacci Number",
    description: "Return the nth Fibonacci number (0, 1, 1, 2, 3, 5, 8...).",
    initialCode: "function fibonacci(n) {\n  // Your code here\n  \n}",
    solution: "function fibonacci(n) {\n  if (n <= 1) return n;\n  let prev = 0, curr = 1;\n  for (let i = 2; i <= n; i++) {\n    [prev, curr] = [curr, prev + curr];\n  }\n  return curr;\n}",
    testCases: [
      { input: [0], expected: 0 },
      { input: [1], expected: 1 },
      { input: [6], expected: 8 },
      { input: [10], expected: 55 }
    ],
    hints: ["Use iteration or recursion", "Keep track of previous two numbers"],
    difficulty: 3
  },
  {
    id: 7,
    title: "Array Sum",
    description: "Calculate the sum of all numbers in an array.",
    initialCode: "function arraySum(arr) {\n  // Your code here\n  \n}",
    solution: "function arraySum(arr) {\n  return arr.reduce((sum, num) => sum + num, 0);\n}",
    testCases: [
      { input: [[1, 2, 3]], expected: 6 },
      { input: [[10, -5, 3]], expected: 8 },
      { input: [[]], expected: 0 }
    ],
    hints: ["Use reduce() method", "Or use a for loop"],
    difficulty: 2
  },
  {
    id: 8,
    title: "Prime Check",
    description: "Check if a number is prime.",
    initialCode: "function isPrime(n) {\n  // Your code here\n  \n}",
    solution: "function isPrime(n) {\n  if (n <= 1) return false;\n  if (n <= 3) return true;\n  if (n % 2 === 0 || n % 3 === 0) return false;\n  for (let i = 5; i * i <= n; i += 6) {\n    if (n % i === 0 || n % (i + 2) === 0) return false;\n  }\n  return true;\n}",
    testCases: [
      { input: [2], expected: true },
      { input: [4], expected: false },
      { input: [17], expected: true },
      { input: [1], expected: false }
    ],
    hints: ["Check divisibility up to sqrt(n)", "Handle edge cases"],
    difficulty: 4
  },
  {
    id: 9,
    title: "Binary Search",
    description: "Find the index of a target value in a sorted array.",
    initialCode: "function binarySearch(arr, target) {\n  // Your code here\n  \n}",
    solution: "function binarySearch(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}",
    testCases: [
      { input: [[1, 3, 5, 7, 9], 5], expected: 2 },
      { input: [[1, 2, 3, 4, 5], 6], expected: -1 },
      { input: [[10, 20, 30], 10], expected: 0 }
    ],
    hints: ["Divide the search space in half", "Update left and right pointers"],
    difficulty: 4
  },
  {
    id: 10,
    title: "Anagram Check",
    description: "Check if two strings are anagrams of each other.",
    initialCode: "function areAnagrams(str1, str2) {\n  // Your code here\n  \n}",
    solution: "function areAnagrams(str1, str2) {\n  const clean = s => s.toLowerCase().replace(/[^a-z]/g, '').split('').sort().join('');\n  return clean(str1) === clean(str2);\n}",
    testCases: [
      { input: ["listen", "silent"], expected: true },
      { input: ["hello", "world"], expected: false },
      { input: ["Dormitory", "Dirty room"], expected: true }
    ],
    hints: ["Sort both strings", "Compare the sorted versions"],
    difficulty: 3
  }
]

const CodeBreaker: React.FC = () => {
  const [currentPuzzle, setCurrentPuzzle] = useState(0)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [testResults, setTestResults] = useState<{ passed: boolean, expected: any, actual: any }[]>([])
  const [score, setScore] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [completed, setCompleted] = useState<number[]>([])
  const [message, setMessage] = useState('Solve programming puzzles to advance!')

  useEffect(() => {
    setCode(puzzles[currentPuzzle].initialCode)
    setTestResults([])
    setHintsUsed(0)
    setShowHint(false)
    setOutput('')
  }, [currentPuzzle])

  const runCode = useCallback(() => {
    try {
      // Create a safe eval environment
      const func = new Function('return ' + code)()
      const results = puzzles[currentPuzzle].testCases.map(test => {
        try {
          const actual = func(...test.input)
          return {
            passed: JSON.stringify(actual) === JSON.stringify(test.expected),
            expected: test.expected,
            actual
          }
        } catch (e) {
          return {
            passed: false,
            expected: test.expected,
            actual: 'Error: ' + (e as Error).message
          }
        }
      })
      
      setTestResults(results)
      
      if (results.every(r => r.passed)) {
        const points = Math.max(10 * puzzles[currentPuzzle].difficulty - hintsUsed * 5, 5)
        setScore(score + points)
        setMessage(`Puzzle solved! +${points} points`)
        setCompleted([...completed, currentPuzzle])
        
        // Auto advance after 2 seconds
        setTimeout(() => {
          if (currentPuzzle < puzzles.length - 1) {
            setCurrentPuzzle(currentPuzzle + 1)
          } else {
            setMessage('Congratulations! All puzzles completed!')
          }
        }, 2000)
      } else {
        setMessage('Some tests failed. Keep trying!')
      }
    } catch (error) {
      setOutput('Syntax Error: ' + (error as Error).message)
      setTestResults([])
    }
  }, [code, currentPuzzle, hintsUsed, score, completed])

  const showNextHint = () => {
    if (hintsUsed < puzzles[currentPuzzle].hints.length) {
      setShowHint(true)
      setHintsUsed(hintsUsed + 1)
    }
  }

  const showSolution = () => {
    setCode(puzzles[currentPuzzle].solution)
    setHintsUsed(puzzles[currentPuzzle].hints.length + 1)
  }

  const reset = () => {
    setCurrentPuzzle(0)
    setScore(0)
    setCompleted([])
    setMessage('Solve programming puzzles to advance!')
  }

  // Calculate star rating based on performance
  const getStarRating = () => {
    const totalPuzzles = puzzles.length
    const completionRate = completed.length / totalPuzzles
    const avgHintsPerPuzzle = hintsUsed / Math.max(1, completed.length)
    
    if (completionRate >= 0.8 && avgHintsPerPuzzle < 0.5) return 3
    if (completionRate >= 0.5 && avgHintsPerPuzzle < 1) return 2
    if (completionRate >= 0.3) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Code Breaker</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Score: {score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Puzzles: {completed.length}/{puzzles.length}</span>
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
        <div className="mt-2 text-center">
          <span className="text-lg">Puzzle {currentPuzzle + 1}: {puzzles[currentPuzzle].title}</span>
          <span className="ml-4 text-sm">Difficulty: {'⭐'.repeat(puzzles[currentPuzzle].difficulty)}</span>
        </div>
      </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">{puzzles[currentPuzzle].description}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your Code:</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-48 p-3 border rounded font-mono text-sm bg-gray-50"
                spellCheck={false}
              />
            </div>

            {showHint && hintsUsed > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="font-semibold mb-1">Hint {hintsUsed}:</div>
                <div>{puzzles[currentPuzzle].hints[hintsUsed - 1]}</div>
              </div>
            )}

            {testResults.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold mb-2">Test Results:</div>
                {testResults.map((result, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm">
                      Test {i + 1}: Input: {JSON.stringify(puzzles[currentPuzzle].testCases[i].input)} → 
                      Expected: {JSON.stringify(result.expected)}, 
                      Got: {JSON.stringify(result.actual)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {output && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="font-semibold mb-1">Error:</div>
                <div className="text-sm font-mono">{output}</div>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button onClick={runCode} size="lg">
                <Play className="mr-2" />
                Run Code
              </Button>
              
              <Button 
                onClick={showNextHint} 
                variant="outline"
                disabled={hintsUsed >= puzzles[currentPuzzle].hints.length}
              >
                <Lightbulb className="mr-2" />
                Hint ({hintsUsed}/{puzzles[currentPuzzle].hints.length})
              </Button>
              
              <Button onClick={showSolution} variant="secondary">
                Show Solution
              </Button>
              
              {currentPuzzle < puzzles.length - 1 && (
                <Button 
                  onClick={() => setCurrentPuzzle(currentPuzzle + 1)}
                  variant="outline"
                >
                  Skip →
                </Button>
              )}
            </div>

            <div className="mt-4 flex justify-between text-sm">
              <div>Progress: {completed.length}/{puzzles.length} puzzles</div>
              <div>Score: {score}</div>
            </div>

            <div className="mt-2 text-center text-sm text-gray-600">
              {message}
            </div>
      </CardContent>
    </Card>
  )
}

export default CodeBreaker