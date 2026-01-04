'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserProfile as UserProfileType, followUser, unfollowUser } from '../../lib/users';
import { buildAvatarUrl, setAvatarFallback } from '@/utils/avatar';

interface UserProfileProps {
  user: UserProfileType;
}

export function UserProfile({ user: initialUser }: UserProfileProps) {
  const { user: viewer } = useAuth();
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const canFollow = Boolean(viewer) && viewer?.id !== user.id;

  const handleFollowToggle = async () => {
    setLoading(true);
    try {
      if (user.isFollowing) {
        await unfollowUser(user.username);
        setUser((prev) => ({
          ...prev,
          isFollowing: false,
          followersCount: Math.max(0, prev.followersCount - 1),
        }));
      } else {
        await followUser(user.username);
        setUser((prev) => ({
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1,
        }));
      }
    } catch (error) {
      console.error('Failed to toggle follow status', error);
      // Ideally show toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center space-x-6">
        <div className="shrink-0">
          <img
            className="h-24 w-24 rounded-full object-cover border-4 border-gray-100 dark:border-slate-800"
            src={buildAvatarUrl(user.avatarUrl, user.username)}
            alt={user.username}
            onError={(event) => setAvatarFallback(event, user.username)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate dark:text-slate-100">
            {user.displayName || user.username}
          </h1>
          <p className="text-sm text-gray-500 mb-2 dark:text-slate-400">@{user.username}</p>
          {user.bio && (
            <p className="text-gray-700 mb-4 whitespace-pre-wrap dark:text-slate-200">
              {user.bio}
            </p>
          )}
          
          <div className="flex space-x-6 text-sm text-gray-600 dark:text-slate-300">
            <div>
              <span className="font-bold text-gray-900 dark:text-slate-100">{user.postsCount}</span> posts
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-slate-100">{user.followersCount}</span> followers
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-slate-100">{user.followingCount}</span> following
            </div>
          </div>
        </div>
        {canFollow && (
          <div>
            <button
              onClick={handleFollowToggle}
              disabled={loading}
              className={`px-6 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                user.isFollowing
                  ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-transparent dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              } ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {user.isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
