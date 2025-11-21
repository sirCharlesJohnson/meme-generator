'use client';

import { db } from '@/lib/instant';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, user, error } = db.useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentEmail, setSentEmail] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSigningIn(true);
    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(true);
    } catch (err) {
      console.error('Error sending magic code:', err);
      alert('Failed to send verification code. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    setIsVerifying(true);
    try {
      await db.auth.signInWithMagicCode({ email, code });
      // User will be automatically signed in
    } catch (err) {
      console.error('Error verifying code:', err);
      alert('Invalid code. Please check your email and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = () => {
    db.auth.signOut();
    router.push('/');
  };

  // If not authenticated, show login
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Meme Share</h1>
            <p className="text-gray-600">Share and vote on the best memes</p>
          </div>

          {!sentEmail ? (
            <form onSubmit={handleSignIn} className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Sign In</h2>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="mb-6 text-center">
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
                <h2 className="text-2xl font-semibold mb-2 text-gray-900">Check Your Email</h2>
                <p className="text-gray-600 mb-2">
                  We sent a verification code to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500">Enter the code below to sign in.</p>
              </div>
              
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center text-2xl tracking-widest"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => { setSentEmail(false); setCode(''); }}
                  className="text-gray-600 hover:text-gray-900 text-sm underline"
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // User is authenticated, render children with auth context
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Meme Share</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

