import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Users, Clock, TrendingUp, Shield, Zap } from 'lucide-react';
import { useQuery } from 'react-query';
import { api, apiHelpers } from '../services/api';
import { StreamCard } from '../components/Stream/StreamCard';
import { HeroSection } from '../components/Home/HeroSection';
import { StatsSection } from '../components/Home/StatsSection';

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

export const HomePage: React.FC = () => {
  const [featuredStreams, setFeaturedStreams] = useState<Stream[]>([]);
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);

  // Fetch live streams
  const { data: liveStreamsData, isLoading: isLoadingLive } = useQuery(
    'live-streams',
    async () => {
      const response = await api.get('/api/streams/live?limit=12');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch featured streams (most popular)
  const { data: featuredStreamsData, isLoading: isLoadingFeatured } = useQuery(
    'featured-streams',
    async () => {
      const response = await api.get('/api/streams?limit=8&status_filter=live');
      return response.data;
    }
  );

  useEffect(() => {
    if (liveStreamsData) {
      setLiveStreams(liveStreamsData);
    }
    if (featuredStreamsData) {
      setFeaturedStreams(featuredStreamsData);
    }
  }, [liveStreamsData, featuredStreamsData]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Live Now Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-accent-500 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold text-secondary-100">Live Now</h2>
              <span className="bg-accent-500/20 text-accent-400 px-2 py-1 rounded-full text-sm font-medium">
                {liveStreams.length} streams
              </span>
            </div>
            <Link
              to="/search?status=live"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              View All →
            </Link>
          </div>

          {isLoadingLive ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="w-full h-48 bg-secondary-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-secondary-700 rounded mb-2"></div>
                  <div className="h-3 bg-secondary-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : liveStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {liveStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StreamCard stream={stream} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-secondary-400" />
              </div>
              <h3 className="text-lg font-medium text-secondary-300 mb-2">
                No streams live right now
              </h3>
              <p className="text-secondary-500 mb-6">
                Be the first to go live and start streaming!
              </p>
              <Link to="/create-stream" className="btn-primary">
                Start Streaming
              </Link>
            </div>
          )}
        </section>

        {/* Featured Streams */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-secondary-100">Featured</h2>
            </div>
            <Link
              to="/search"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Explore More →
            </Link>
          </div>

          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="w-full h-32 bg-secondary-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-secondary-700 rounded mb-2"></div>
                  <div className="h-3 bg-secondary-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : featuredStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredStreams.slice(0, 4).map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StreamCard stream={stream} featured />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-secondary-500">
                No featured streams available at the moment.
              </p>
            </div>
          )}
        </section>

        {/* AI Features Section */}
        <section className="bg-gradient-to-r from-primary-600/10 to-accent-600/10 rounded-2xl p-8 border border-primary-500/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-primary-600/20 text-primary-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              <span>AI-Powered Safety</span>
            </div>
            <h2 className="text-3xl font-bold text-secondary-100 mb-4">
              Safe Streaming, Real-Time Protection
            </h2>
            <p className="text-secondary-400 text-lg max-w-2xl mx-auto">
              StreamGuard V2 uses advanced AI to filter toxic comments instantly, 
              creating a harassment-free environment for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-100 mb-2">
                Real-Time Filtering
              </h3>
              <p className="text-secondary-400">
                Comments are analyzed and filtered instantly using advanced LSTM neural networks.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-accent-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-accent-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-100 mb-2">
                Community Safety
              </h3>
              <p className="text-secondary-400">
                Protect your viewers and yourself from harassment, hate speech, and toxic behavior.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-success-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-success-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-100 mb-2">
                Instant Response
              </h3>
              <p className="text-secondary-400">
                Messages are processed in milliseconds, ensuring smooth real-time chat experience.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
