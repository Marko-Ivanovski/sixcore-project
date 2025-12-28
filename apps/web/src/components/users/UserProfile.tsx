'use client';

import { useState } from 'react';
import { UserProfile as UserProfileType, followUser, unfollowUser } from '../../lib/users';

interface UserProfileProps {
  user: UserProfileType;
}

export function UserProfile({ user: initialUser }: UserProfileProps) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);

  const handleFollowToggle = async () => {
    setLoading(true);
    try {
      let result;
      if (user.isFollowing) {
        result = await unfollowUser(user.username);
        setUser((prev) => ({
          ...prev,
          isFollowing: false,
          followersCount: Math.max(0, prev.followersCount - 1),
        }));
      } else {
        result = await followUser(user.username);
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
    <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-6">
        <div className="shrink-0">
          <img
            className="h-24 w-24 rounded-full object-cover border-4 border-gray-100 dark:border-zinc-800"
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}`}
            alt={user.username}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
            {user.displayName || user.username}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">@{user.username}</p>
          {user.bio && (
            <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
              {user.bio}
            </p>
          )}
          
          <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-bold text-gray-900 dark:text-white">{user.postsCount}</span> posts
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">{user.followersCount}</span> followers
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">{user.followingCount}</span> following
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={handleFollowToggle}
            disabled={loading}
            className={`px-6 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              user.isFollowing
                ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 border border-transparent'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            } ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {user.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>
    </div>
  );
}
