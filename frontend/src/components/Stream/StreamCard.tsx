import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Users, Clock, Eye, Shield, MessageCircle } from 'lucide-react';
import { apiHelpers } from '../../services/api';

interface Stream {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  category?: string;
  tags: string[];
  status: string;
  is_public: boolean;
  viewer_count: number;
  max_viewer_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  scheduled_start?: string;
  actual_start?: string;
  ended_at?: string;
  duration_minutes: number;
  getstream_channel_id?: string;
  chat_enabled: boolean;
  toxic_filter_enabled: boolean;
  allow_guests: boolean;
  created_at: string;
  updated_at?: string;
  streamer: {
    id: number;
    uuid: string;
    username: string;
    avatar_url?: string;
    is_verified: boolean;
  };
}

interface StreamCardProps {
  stream: Stream;
  featured?: boolean;
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, featured = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-accent-500/20 text-accent-400 border-accent-500/30';
      case 'ended':
        return 'bg-warning-500/20 text-warning-400 border-warning-500/30';
      default:
        return 'bg-secondary-700/50 text-secondary-300 border-secondary-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return 'LIVE';
      case 'ended':
        return 'ENDED';
      default:
        return 'OFFLINE';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`card-hover overflow-hidden ${featured ? 'lg:col-span-2' : ''}`}
    >
      <Link to={`/stream/${stream.id}`} className="block">
        {/* Stream Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-secondary-700 to-secondary-800">
          {/* Placeholder for stream thumbnail */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Play className="w-8 h-8 text-primary-400" />
              </div>
              <div className="text-secondary-400 text-sm">
                {stream.status === 'live' ? 'Live Stream' : 'Stream Preview'}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <div className={`streaming-status ${getStatusColor(stream.status)}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                stream.status === 'live' ? 'bg-accent-500 animate-pulse' : 'bg-secondary-400'
              }`}></div>
              {getStatusText(stream.status)}
            </div>
          </div>

          {/* Viewer Count */}
          {stream.status === 'live' && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
              <div className="flex items-center space-x-1 text-white text-sm">
                <Eye className="w-4 h-4" />
                <span>{apiHelpers.formatViewerCount(stream.viewer_count)}</span>
              </div>
            </div>
          )}

          {/* AI Protection Badge */}
          {stream.toxic_filter_enabled && (
            <div className="absolute bottom-3 right-3">
              <div className="bg-success-600/20 text-success-400 px-2 py-1 rounded-lg text-xs flex items-center space-x-1 backdrop-blur-sm">
                <Shield className="w-3 h-3" />
                <span>AI Protected</span>
              </div>
            </div>
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        </div>

        {/* Stream Info */}
        <div className="p-4">
          {/* Stream Title */}
          <h3 className="text-lg font-semibold text-secondary-100 mb-2 line-clamp-2">
            {stream.title}
          </h3>

          {/* Streamer Info */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              {stream.streamer.avatar_url ? (
                <img
                  src={stream.streamer.avatar_url}
                  alt={stream.streamer.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {stream.streamer.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-secondary-300 font-medium">
                  {stream.streamer.username}
                </span>
                {stream.streamer.is_verified && (
                  <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stream Stats */}
          <div className="flex items-center justify-between text-sm text-secondary-400">
            <div className="flex items-center space-x-4">
              {stream.status === 'live' && (
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{apiHelpers.formatViewerCount(stream.viewer_count)}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{stream.comment_count}</span>
              </div>
            </div>
            
            {stream.duration_minutes > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{apiHelpers.formatDuration(stream.duration_minutes)}</span>
              </div>
            )}
          </div>

          {/* Category and Tags */}
          {(stream.category || stream.tags.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {stream.category && (
                <span className="bg-primary-600/20 text-primary-400 px-2 py-1 rounded text-xs">
                  {stream.category}
                </span>
              )}
              {stream.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="bg-secondary-700/50 text-secondary-300 px-2 py-1 rounded text-xs">
                  #{tag}
                </span>
              ))}
              {stream.tags.length > 2 && (
                <span className="text-secondary-500 text-xs">
                  +{stream.tags.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};
