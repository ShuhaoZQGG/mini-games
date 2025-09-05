'use client'

import { useState } from 'react'
import { scoreService, syncLocalScoresToSupabase } from '@/lib/services/scores'

export function ScoreTest() {
  const [testGameId] = useState('test-game')
  const [testScore, setTestScore] = useState(100)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testSubmitScore = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await scoreService.saveScore(testGameId, testScore, { 
        testMetadata: 'This is a test score',
        timestamp: new Date().toISOString()
      })
      setResult({ type: 'submit', data: response })
    } catch (error) {
      setResult({ type: 'submit', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testGetLeaderboard = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await scoreService.getLeaderboard({ gameId: testGameId })
      setResult({ type: 'leaderboard', data: response })
    } catch (error) {
      setResult({ type: 'leaderboard', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testGetPersonalBest = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await scoreService.getPersonalBest(testGameId)
      setResult({ type: 'personal_best', data: response })
    } catch (error) {
      setResult({ type: 'personal_best', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testSyncScores = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await syncLocalScoresToSupabase()
      setResult({ type: 'sync', data: response })
    } catch (error) {
      setResult({ type: 'sync', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-4">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        Score Service Test
      </h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label htmlFor="test-score" className="text-sm font-medium">Test Score:</label>
          <input
            id="test-score"
            type="number"
            value={testScore}
            onChange={(e) => setTestScore(parseInt(e.target.value))}
            className="px-3 py-1 border rounded w-20"
          />
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Game ID: {testGameId}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={testSubmitScore}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Submit Score'}
        </button>
        
        <button
          onClick={testGetLeaderboard}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Leaderboard'}
        </button>
        
        <button
          onClick={testGetPersonalBest}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Personal Best'}
        </button>
        
        <button
          onClick={testSyncScores}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Sync to Supabase'}
        </button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded border">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Result ({result.type}):
          </h4>
          <pre className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-600 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}