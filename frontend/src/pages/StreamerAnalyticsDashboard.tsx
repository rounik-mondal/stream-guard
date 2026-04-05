// frontend/src/pages/StreamerAnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Users, Heart, MessageSquare, Activity, Clock } from 'lucide-react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface AnalyticsData {
  totalStreams: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  streams: {
    id: number;
    title: string;
    createdAt: string;
    durationMinutes: number;
    viewerCount: number;
    likeCount: number;
    commentCount: number;
    status: string;
  }[];
}

export const StreamerAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const { data, isLoading } = useQuery(
    'streamer-analytics',
    async () => {
      const response = await api.get('/api/streams/me/analytics');
      return response.data;
    },
    { refetchInterval: 30000 }
  );

  useEffect(() => {
    if (data) setAnalytics(data);
  }, [data]);

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-900">
        <div className="spinner w-12 h-12 border-primary-500 border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-500/20 rounded-xl rounded-tr-none">
              <Activity className="w-8 h-8 text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-accent-500">
                Creator Analytics
              </h1>
              <p className="text-secondary-400">Track your streaming performance</p>
            </div>
          </div>
          <Link to="/create-stream" className="btn-primary">
            + New Stream
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card p-6 border-t-4 border-t-primary-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-secondary-400 text-sm font-medium">Total Streams</p>
                <p className="text-3xl font-bold text-secondary-100 mt-2">{analytics.totalStreams}</p>
              </div>
              <Video className="w-8 h-8 text-primary-400/50" />
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card p-6 border-t-4 border-t-accent-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-secondary-400 text-sm font-medium">Total Lifetime Views</p>
                <p className="text-3xl font-bold text-secondary-100 mt-2">{analytics.totalViews}</p>
              </div>
              <Users className="w-8 h-8 text-accent-400/50" />
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="card p-6 border-t-4 border-t-error-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-secondary-400 text-sm font-medium">Total Likes</p>
                <p className="text-3xl font-bold text-secondary-100 mt-2">{analytics.totalLikes}</p>
              </div>
              <Heart className="w-8 h-8 text-error-400/50" />
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="card p-6 border-t-4 border-t-success-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-secondary-400 text-sm font-medium">Chat Engagement</p>
                <p className="text-3xl font-bold text-secondary-100 mt-2">{analytics.totalComments}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-success-400/50" />
            </div>
          </motion.div>
        </div>

        {/* Individual Streams Table */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="card p-6">
          <h2 className="text-xl font-bold text-secondary-100 mb-6 flex items-center">
            <Video className="w-5 h-5 mr-2 text-primary-400" />
            Stream History
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-secondary-700 text-secondary-400 text-sm">
                  <th className="pb-3 px-4 font-medium">Stream Title</th>
                  <th className="pb-3 px-4 font-medium">Date</th>
                  <th className="pb-3 px-4 font-medium">Duration</th>
                  <th className="pb-3 px-4 font-medium">Views</th>
                  <th className="pb-3 px-4 font-medium">Engagements</th>
                  <th className="pb-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {analytics.streams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-secondary-500">No streams found. Start broadcasting!</td>
                  </tr>
                ) : (
                  analytics.streams.map((stream) => (
                    <tr key={stream.id} className="border-b border-secondary-800/50 hover:bg-secondary-800/20 transition-colors">
                      <td className="py-4 px-4">
                        <Link to={`/stream/${stream.id}`} className="font-medium text-primary-400 hover:text-primary-300">
                          {stream.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-secondary-300">
                        {new Date(stream.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-secondary-300 flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-secondary-500" />
                        <span>{stream.durationMinutes} min</span>
                      </td>
                      <td className="py-4 px-4 text-secondary-300">
                        {stream.viewerCount}
                      </td>
                      <td className="py-4 px-4 text-secondary-300">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center"><Heart className="w-3 h-3 text-error-400 mr-1" /> {stream.likeCount}</span>
                          <span className="flex items-center"><MessageSquare className="w-3 h-3 text-secondary-400 mr-1" /> {stream.commentCount}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          stream.status === 'LIVE' ? 'bg-accent-500/20 text-accent-400' 
                          : 'bg-secondary-700 text-secondary-400'
                        }`}>
                          {stream.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
