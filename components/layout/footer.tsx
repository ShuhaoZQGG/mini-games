import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 mt-auto">
      <div className="container-responsive py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">MiniGames</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Play exciting mini-games online for free. No registration required!
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Popular Games</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/games/cps-test" className="hover:text-primary">CPS Test</Link></li>
              <li><Link href="/games/memory-match" className="hover:text-primary">Memory Match</Link></li>
              <li><Link href="/games/typing-test" className="hover:text-primary">Typing Test</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/games?category=speed" className="hover:text-primary">Speed Games</Link></li>
              <li><Link href="/games?category=puzzle" className="hover:text-primary">Puzzle Games</Link></li>
              <li><Link href="/games?category=strategy" className="hover:text-primary">Strategy Games</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600 dark:text-gray-400">
          © 2024 MiniGames. All rights reserved.
        </div>
      </div>
    </footer>
  )
}