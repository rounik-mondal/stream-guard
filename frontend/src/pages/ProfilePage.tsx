import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Users, 
  Video, 
  Clock, 
  Settings, 
  MessageCircle,
  Heart,
  Share2,
  Shield
} from 'lucide-react';
import { useQuery } from 'react-query';
import { api, apiHelpers } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Define the shape of the profile data coming from the backend
interface ProfileData {
  id: number;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  stream: { id: number } | null;
  stream_count: number; // We added this in the controller
  _count: {
    followers: number;
    following: number;
  };
}

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'streams' | 'about'>('streams');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Fetch user profile
  const { data: profile, isLoading, error } = useQuery<ProfileData>(
    ['user-profile', username],
    async () => {
      const response = await api.get(`/api/users/username/${username}`);
      return response.data;
    },
    {
      enabled: !!username,
    }
  );

  // Fetch user streams
  const { data: streams } = useQuery(
    ['user-streams', username],
    async () => {
      // This endpoint now works because of our backend fix
      const response = await api.get(`/api/streams?streamer=${username}`);
      return response.data;
    },
    {
      enabled: !!username,
    }
  );

  // Check following status
  const { data: followingStatus } = useQuery(
    ['following-status', profile?.id],
    async () => {
      if (!profile || !currentUser || profile.id === currentUser.id) return false;
      // This endpoint now works because of our backend fix
      const response = await api.get(`/api/users/${profile.id}/is-following`);
      return response.data.is_following;
    },
    {
      enabled: !!profile && !!currentUser && profile.id !== currentUser.id,
    }
  );

  useEffect(() => {
    if (profile) {
      // FIXED: Read from the _count object
      setFollowersCount(profile._count.followers);
    }
    if (followingStatus !== undefined) {
      setIsFollowing(followingStatus);
    }
  }, [profile, followingStatus]);

  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      if (isFollowing) {
        await api.delete(`/api/users/${profile.id}/follow`);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await api.post(`/api/users/${profile.id}/follow`);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-100 mb-4">User Not Found</h2>
          <p className="text-secondary-400 mb-6">The user you're looking for doesn't exist.</p>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
              {/* FIXED: avatar_url -> avatarUrl */}
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-secondary-100">
                  {/* FIXED: full_name -> bio (where full_name is stored) */}
                  {profile.bio || profile.username}
                </h1>
                {/* FIXED: is_verified -> isVerified */}
                {profile.isVerified && (
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
                {/* FIXED: is_streamer -> check if stream exists */}
                {!!profile.stream && (
                  <div className="bg-accent-600/20 text-accent-400 px-2 py-1 rounded-full text-sm">
                    Streamer
                  </div>
                )}
              </div>

              <p className="text-secondary-400 mb-4">
                @{profile.username}
              </p>

              {profile.bio && (
                <p className="text-secondary-300 mb-6 max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary-100">
                    {/* FIXED: stream_count -> stream_count (from formattedUser) */}
                    {profile.stream_count}
                  </div>
                  <div className="text-sm text-secondary-400">Streams</div>
                </div>
                {/* <div className="text-center">
                  <div className="text-2xl font-bold text-secondary-100">
                    {followersCount}
                  </div>
                  <div className="text-sm text-secondary-400">Followers</div>
                </div> */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary-100">
                    {/* FIXED: following_count -> _count.following */}
                    {profile._count.following}
                  </div>
                  <div className="text-sm text-secondary-400">Followers</div>
                </div>
                {/* Removed Watch Time as this data doesn't exist yet */}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {isOwnProfile ? (
                  <Link to="/settings" className="btn-secondary flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`btn-primary flex items-center space-x-2 ${
                        isFollowing ? 'bg-secondary-600 hover:bg-secondary-500' : ''
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>{isFollowing ? 'Following' : 'Follow'}</span>
                    </button>
                    <button className="btn-ghost flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                  </>
                )}
                <button className="btn-ghost flex items-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-secondary-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('streams')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'streams'
                ? 'bg-primary-600 text-white'
                : 'text-secondary-400 hover:text-secondary-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Streams</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'about'
                ? 'bg-primary-600 text-white'
                : 'text-secondary-400 hover:text-secondary-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <User className="w-4 h-4" />
              <span>About</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'streams' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-100">
                {/* FIXED: Use stream_count */}
                {profile.stream_count} Streams
              </h2>
              {isOwnProfile && (
                <Link to="/create-stream" className="btn-primary">
                  Create Stream
                </Link>
              )}
            </div>

            {/* NOTE: The 'streams' object uses snake_case because it comes from
                our formatStreamForFrontend helper. This part is already correct. */}
            {streams && streams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {streams.map((stream: any, index: number) => (
                  <motion.div
                    key={stream.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/stream/${stream.id}`} className="block">
                      <div className="card-hover overflow-hidden">
                        <div className="aspect-video bg-gradient-to-br from-secondary-700 to-secondary-800 relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="w-12 h-12 text-secondary-400" />
                          </div>
                          
                          <div className="absolute top-3 left-3">
                            <div className={`streaming-status ${
                              stream.status === 'live' 
                                ? 'status-live' 
                                : 'status-offline'
                            }`}>
                              {stream.status === 'live' ? 'LIVE' : 'ENDED'}
                            </div>
                          </div>

                          {stream.toxic_filter_enabled && (
                            <div className="absolute top-3 right-3">
                              <div className="bg-success-600/20 text-success-400 px-2 py-1 rounded-lg text-xs flex items-center space-x-1">
                                <Shield className="w-3 h-3" />
                                <span>AI</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-secondary-100 mb-2 line-clamp-2">
                            {stream.title}
                          </h3>
                          <div className="flex items-center justify-between text-sm text-secondary-400">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{stream.viewer_count}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{stream.comment_count}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              {/* This helper was in your api.ts, assuming it exists */}
                              <span>{apiHelpers.formatDate(stream.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-secondary-400" />
                </div>
                <h3 className="text-lg font-medium text-secondary-300 mb-2">
                  No streams yet
                </h3>
                <p className="text-secondary-500 mb-6">
                  {isOwnProfile 
                    ? "You haven't created any streams yet."
                    : `${profile.username} hasn't created any streams yet.`
                  }
                </p>
                {isOwnProfile && (
                  <Link to="/create-stream" className="btn-primary">
                    Create Your First Stream
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* About Section */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-secondary-100 mb-4">About</h3>
              {profile.bio ? (
                <p className="text-secondary-300 leading-relaxed">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-secondary-500 italic">
                  {isOwnProfile 
                    ? "Add a bio to tell people about yourself."
                    : "No bio available."
                  }
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-secondary-100 mb-4">Streaming Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-400">Total Streams</span>
                    {/* FIXED: Use stream_count */}
                    <span className="text-secondary-100 font-medium">{profile.stream_count}</span>
                  </div>
                  {/* REMOVED total_watch_time */}
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-400">Member Since</span>
                    <span className="text-secondary-100 font-medium">
                      {/* FIXED: This now exists */}
                      {apiHelpers.formatDate(profile.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-secondary-100 mb-4">Community</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-400">Followers</span>
                    <span className="text-secondary-100 font-medium">{followersCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-400">Following</span>
                    {/* FIXED: Use _count.following */}
                    <span className="text-secondary-100 font-medium">{profile._count.following}</span>
                  </div>
                  {/* REMOVED last_login */}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};