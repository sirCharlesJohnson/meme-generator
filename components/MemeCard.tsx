'use client';

import { db } from '@/lib/instant';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Meme {
  id: string;
  title: string;
  imageUrl: string;
  userId: string;
  userEmail: string;
  createdAt: number;
  editorState?: string;
}

interface Upvote {
  id: string;
  memeId: string;
  userId: string;
}

interface MemeCardProps {
  meme: Meme;
  upvotes: Upvote[];
  currentUserId: string;
  onMemeClick?: () => void;
}

export function MemeCard({ meme, upvotes, currentUserId, onMemeClick }: MemeCardProps) {
  const router = useRouter();
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  
  // Calculate upvote count and check if current user has upvoted
  const upvoteCount = upvotes.filter(u => u.memeId === meme.id).length;
  const userUpvote = upvotes.find(u => u.memeId === meme.id && u.userId === currentUserId);
  const hasUpvoted = !!userUpvote;

  const handleUpvote = async () => {
    if (isUpvoting) return;
    
    setIsUpvoting(true);
    try {
      if (hasUpvoted && userUpvote) {
        // Remove upvote
        await db.transact(
          db.tx.upvotes[userUpvote.id].delete()
        );
      } else {
        // Add upvote
        await db.transact(
          db.tx.upvotes[crypto.randomUUID()].update({
            memeId: meme.id,
            userId: currentUserId,
          })
        );
      }
    } catch (err) {
      console.error('Error toggling upvote:', err);
    } finally {
      setIsUpvoting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleCopyLink = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isCopying) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(meme.imageUrl);
    } catch (err) {
      console.error('Error copying link:', err);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div 
        className="relative w-full h-96 cursor-pointer"
        onClick={onMemeClick}
      >
        <Image
          src={meme.imageUrl}
          alt={meme.title}
          fill
          className="object-contain bg-gray-100"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{meme.title}</h3>
        
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600 flex-1 min-w-0">
            <span className="font-medium break-all">{meme.userEmail}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(meme.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const url = `/create?image=${encodeURIComponent(
                  meme.imageUrl
                )}&title=${encodeURIComponent(meme.title)}&fromMeme=${encodeURIComponent(
                  meme.id
                )}`;
                router.push(url);
              }}
              className="px-3 py-1 text-xs font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Remix
            </button>
            <a
              href={meme.imageUrl}
              download
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Download
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={isCopying}
              className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isCopying ? 'Copied' : 'Copy Link'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpvote();
              }}
              disabled={isUpvoting}
              className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors font-medium text-xs ${
                hasUpvoted
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg
                className="w-4 h-4"
                fill={hasUpvoted ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              <span>{upvoteCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

