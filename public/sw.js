const CACHE_NAME = 'mini-games-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/offline.html',
  '/games/cps-test',
  '/games/memory-match',
  '/games/typing-test',
  '/games/snake',
  '/games/2048',
  '/games/sudoku',
  '/games/reaction-time',
  '/games/tic-tac-toe',
  '/games/minesweeper',
  '/games/connect-four',
  '/games/word-search',
  '/games/tetris',
  '/games/aim-trainer',
  '/games/breakout',
  '/games/mental-math'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => {
          console.log('Cache addAll error:', err);
        });
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests - let them go to network
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache same-origin resources
              if (event.request.url.startsWith(self.location.origin)) {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(() => {
          // Network request failed, try to get from cache
          return caches.match(OFFLINE_URL);
        });
      })
  );
});

// Background sync for score submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

async function syncScores() {
  try {
    // Get pending scores from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending_scores', 'readonly');
    const store = tx.objectStore('pending_scores');
    const scores = await store.getAll();

    // Submit each score
    for (const score of scores) {
      try {
        const response = await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(score)
        });

        if (response.ok) {
          // Remove from pending scores
          const deleteTx = db.transaction('pending_scores', 'readwrite');
          const deleteStore = deleteTx.objectStore('pending_scores');
          await deleteStore.delete(score.id);
        }
      } catch (error) {
        console.error('Failed to sync score:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync scores:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MiniGamesDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_scores')) {
        db.createObjectStore('pending_scores', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});