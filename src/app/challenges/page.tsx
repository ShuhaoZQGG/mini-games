import DailyChallengesManager from '@/components/daily-challenges/daily-challenges-manager'

export default function ChallengesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Daily Challenges</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete daily challenges to earn XP, badges, and maintain your streak!
          </p>
        </div>
        
        <DailyChallengesManager />
      </div>
    </div>
  )
}