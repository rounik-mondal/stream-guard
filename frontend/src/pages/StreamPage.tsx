import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Users, Share2, Heart, Shield, MessageCircle } from 'lucide-react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { ChatInterface } from '../components/Chat/ChatInterface';

export const StreamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Fetch stream data
  const { data: stream, isLoading, error } = useQuery(
    ['stream', id],
    async () => {
      const response = await api.get(`/api/streams/${id}`);
      return response.data;
    },
    {
      enabled: !!id,
      refetchInterval: 5000, // Refetch every 5 seconds for live data
    }
  );

  useEffect(() => {
    if (stream) {
      setLikeCount(stream.like_count);
    }
  }, [stream]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    // TODO: Implement actual like API call
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: stream?.title,
        text: `Check out this stream: ${stream?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-100 mb-4">Stream Not Found</h2>
          <p className="text-secondary-400 mb-6">The stream you're looking for doesn't exist or has ended.</p>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stream Player */}
            <div className="card overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-secondary-800 to-secondary-900 relative">
                {/* Placeholder for actual stream player */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-10 h-10 text-primary-400" />
                    </div>
                    <div className="text-secondary-400">
                      {stream.status === 'live' ? 'Live Stream' : 'Stream Ended'}
                    </div>
                  </div>
                </div>

                {/* Stream Status */}
                <div className="absolute top-4 left-4">
                  <div className={`streaming-status ${
                    stream.status === 'live' 
                      ? 'status-live' 
                      : stream.status === 'ended' 
                      ? 'status-ended' 
                      : 'status-offline'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      stream.status === 'live' ? 'bg-accent-500 animate-pulse' : 'bg-secondary-400'
                    }`}></div>
                    {stream.status === 'live' ? 'LIVE' : stream.status === 'ended' ? 'ENDED' : 'OFFLINE'}
                  </div>
                </div>

                {/* Viewer Count */}
                {stream.status === 'live' && (
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2 text-white">
                      <Users className="w-4 h-4" />
                      <span>{stream.viewer_count} watching</span>
                    </div>
                  </div>
                )}

                {/* AI Protection Badge */}
                {stream.toxic_filter_enabled && (
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-success-600/20 text-success-400 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 backdrop-blur-sm border border-success-500/30">
                      <Shield className="w-4 h-4" />
                      <span>AI Protected</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stream Info */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-secondary-100 mb-2">
                    {stream.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-secondary-400">
                    <span>{stream.viewer_count} viewers</span>
                    <span>•</span>
                    <span>{stream.comment_count} comments</span>
                    {stream.duration_minutes > 0 && (
                      <>
                        <span>•</span>
                        <span>{Math.floor(stream.duration_minutes / 60)}h {stream.duration_minutes % 60}m</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isLiked 
                        ? 'bg-accent-600 text-white' 
                        : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likeCount}</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 bg-secondary-700 text-secondary-300 rounded-lg hover:bg-secondary-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Streamer Info */}
              <div className="flex items-center space-x-4 mb-4">
                <Link to={`/profile/${stream.streamer.username}`} className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    {stream.streamer.avatar_url ? (
                      <img
                        src={stream.streamer.avatar_url}
                        alt={stream.streamer.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {stream.streamer.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-secondary-100 font-medium">
                        {stream.streamer.username}
                      </span>
                      {stream.streamer.is_verified && (
                        <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-secondary-400">
                      {stream.streamer.follower_count} followers
                    </div>
                  </div>
                </Link>
              </div>

              {/* Description */}
              {stream.description && (
                <div className="text-secondary-300 mb-4">
                  {stream.description}
                </div>
              )}

              {/* Tags */}
              {stream.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {stream.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-100 flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Live Chat</span>
                </h3>
                {stream.toxic_filter_enabled && (
                  <div className="flex items-center space-x-1 text-success-400 text-sm">
                    <Shield className="w-4 h-4" />
                    <span>Protected</span>
                  </div>
                )}
              </div>

              <ChatInterface streamId={stream.id} isEnabled={stream.chat_enabled} />
            </div>

            {/* Stream Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-secondary-100 mb-4">Stream Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-secondary-400">Current Viewers</span>
                  <span className="text-secondary-100 font-medium">{stream.viewer_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-400">Peak Viewers</span>
                  <span className="text-secondary-100 font-medium">{stream.max_viewer_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-400">Total Comments</span>
                  <span className="text-secondary-100 font-medium">{stream.comment_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-400">Likes</span>
                  <span className="text-secondary-100 font-medium">{likeCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
