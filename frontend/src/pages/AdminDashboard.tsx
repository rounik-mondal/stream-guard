// frontend/src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Activity, MessageSquare, AlertTriangle, UserX } from 'lucide-react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface AdminStats {
  platform: {
    totalUsers: number;
    totalStreams: number;
    liveStreams: number;
  };
  moderation: {
    totalMessages: number;
    blockedMessages: number;
    blockRate: number;
  };
  toxicUsers: {
    id: number;
    username: string;
    avatarUrl: string | null;
    toxicScore: number;
    isBanned: boolean;
  }[];
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [banModalState, setBanModalState] = useState<{ isOpen: boolean; userId: number | null }>({ isOpen: false, userId: null });

  const { data, isLoading, refetch } = useQuery(
    'admin-dashboard-stats',
    async () => {
      const response = await api.get('/api/admin/dashboard');
      return response.data;
    },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  useEffect(() => {
    if (data) setStats(data);
  }, [data]);

  const confirmBanUser = async () => {
    if (!banModalState.userId) return;
    try {
      await api.post(`/api/admin/ban/${banModalState.userId}`);
      toast.success('User banned globally.');
      setBanModalState({ isOpen: false, userId: null });
      refetch();
    } catch (err) {
      toast.error('Failed to ban user.');
    }
  };

  const handleBanUser = (userId: number) => {
    setBanModalState({ isOpen: true, userId });
  };

  if (isLoading || !stats) {
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
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-error-500/20 rounded-xl rounded-tr-none">
            <Shield className="w-8 h-8 text-error-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-error-400 to-accent-500">Moderation Control Center</h1>
            <p className="text-secondary-400">Platform-wide safety and analytics dashboard</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card p-6 border-t-4 border-t-primary-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-secondary-400 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-secondary-100 mt-2">{stats.platform.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-primary-400/50" />
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card p-6 border-t-4 border-t-success-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-secondary-400 text-sm font-medium">Live Streams</p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <p className="text-3xl font-bold text-secondary-100">{stats.platform.liveStreams}</p>
                  <p className="text-sm text-secondary-500">/ {stats.platform.totalStreams} total</p>
                </div>
              </div>
              <Activity className="w-8 h-8 text-success-400/50" />
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="card p-6 border-t-4 border-t-accent-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-secondary-400 text-sm font-medium">Total Messages</p>
                <p className="text-3xl font-bold text-secondary-100 mt-2">{stats.moderation.totalMessages}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-accent-400/50" />
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="card p-6 border-t-4 border-t-error-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-secondary-400 text-sm font-medium">Auto-Blocked</p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <p className="text-3xl font-bold text-error-400">{stats.moderation.blockedMessages}</p>
                  <p className="text-sm text-error-400/70">({stats.moderation.blockRate.toFixed(1)}%)</p>
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-error-400/50" />
            </div>
          </motion.div>
        </div>

        {/* Toxic Users Table */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-secondary-100 flex items-center">
              <UserX className="w-5 h-5 mr-2 text-error-400" />
              Highest Toxicity Offenders
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-secondary-700 text-secondary-400 text-sm">
                  <th className="pb-3 px-4 font-medium">User</th>
                  <th className="pb-3 px-4 font-medium">Toxicity Score</th>
                  <th className="pb-3 px-4 font-medium">Status</th>
                  <th className="pb-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {stats.toxicUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-secondary-500">No toxic behavior detected yet.</td>
                  </tr>
                ) : (
                  stats.toxicUsers.map((user) => (
                    <tr key={user.id} className="border-b border-secondary-800/50 hover:bg-secondary-800/20 transition-colors">
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-700 flex items-center justify-center overflow-hidden">
                          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-secondary-200">{user.username}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-full max-w-[100px] bg-secondary-700 rounded-full h-2">
                            <div className="bg-error-500 h-2 rounded-full" style={{ width: `${Math.min(user.toxicScore * 10, 100)}%` }}></div>
                          </div>
                          <span className="text-error-400 font-bold">{user.toxicScore}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.isBanned ? (
                          <span className="px-2 py-1 bg-error-500/20 text-error-400 rounded-full text-xs font-bold">BANNED</span>
                        ) : (
                          <span className="px-2 py-1 bg-success-500/20 text-success-400 rounded-full text-xs font-bold">ACTIVE</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => handleBanUser(user.id)}
                          disabled={user.isBanned}
                          className="px-3 py-1 bg-error-500/10 text-error-400 hover:bg-error-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                        >
                          {user.isBanned ? 'Global Banned' : 'Ban Globally'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <ConfirmModal
          isOpen={banModalState.isOpen}
          title="Global Ban"
          message="Are you certain you want to globally ban this user? They will totally lose access to the platform."
          confirmText="Ban User"
          isDestructive={true}
          onClose={() => setBanModalState({ isOpen: false, userId: null })}
          onConfirm={confirmBanUser}
        />

      </div>
    </div>
  );
};
