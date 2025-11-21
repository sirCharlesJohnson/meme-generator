'use client';

import { db } from '@/lib/instant';
import { MemeCard } from '@/components/MemeCard';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { user } = db.useAuth();
  
  // Query memes and upvotes
  const { isLoading, error, data } = db.useQuery({
    memes: {},
    upvotes: {},
  });

  if (!user) {
    return null;
  }

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Meme Feed</h2>
            <p className="text-gray-600 mt-1">Share and vote on the best memes</p>
          </div>
          <button
            onClick={() => router.push('/create')}
            className="bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium"
          >
            Post a Meme
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading memes...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
            Error loading memes. Please try refreshing the page.
          </div>
        )}

        {data && (
          <>
            {data.memes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No memes yet</h3>
                <p className="text-gray-600 mb-4">Be the first to post a meme!</p>
                <button
                  onClick={() => router.push('/create')}
                  className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium"
                >
                  Post a Meme
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...data.memes]
                  .sort((a: any, b: any) => {
                    // Sort by upvote count first, then by created date
                    const aUpvotes = data.upvotes.filter((u: any) => u.memeId === a.id).length;
                    const bUpvotes = data.upvotes.filter((u: any) => u.memeId === b.id).length;
                    
                    if (bUpvotes !== aUpvotes) {
                      return bUpvotes - aUpvotes;
                    }
                    
                    return b.createdAt - a.createdAt;
                  })
                  .map((meme: any) => (
                    <MemeCard
                      key={meme.id}
                      meme={meme as any}
                      upvotes={data.upvotes as any}
                      currentUserId={user.id}
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>
  );
}

