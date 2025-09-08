import { ScoreTest } from '@/components/debug/score-test'

export default function DebugPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Database Connection Debug
      </h1>
      
      <div className="max-w-2xl mx-auto">
        <ScoreTest />
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Setup Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Create a Supabase account and new project</li>
            <li>Run the SQL migration in your Supabase SQL editor</li>
            <li>Copy .env.example to .env.local and add your credentials</li>
            <li>Restart the development server</li>
            <li>Test the functions above to verify connection</li>
          </ol>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Note:</strong> If Supabase is not configured, the system will 
              automatically fall back to localStorage with mock data.
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Status</h2>
          <div className="text-sm space-y-1">
            <div>
              Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
            </div>
            <div>
              Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Database Debug - Mini Games',
  description: 'Debug page for testing database connection and score service',
}