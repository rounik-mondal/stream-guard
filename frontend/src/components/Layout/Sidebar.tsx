import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Compass, 
  TrendingUp, 
  Users, 
  Gamepad2, 
  Music, 
  Camera, 
  Code,
  Heart,
  MessageCircle,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const categories = [
  { id: 'all', name: 'All', icon: Home },
  { id: 'discover', name: 'Discover', icon: Compass },
  { id: 'trending', name: 'Trending', icon: TrendingUp },
  { id: 'following', name: 'Following', icon: Users },
];

const streamCategories = [
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: 'text-green-400' },
  { id: 'music', name: 'Music', icon: Music, color: 'text-purple-400' },
  { id: 'art', name: 'Art', icon: Camera, color: 'text-pink-400' },
  { id: 'tech', name: 'Tech', icon: Code, color: 'text-blue-400' },
  { id: 'lifestyle', name: 'Lifestyle', icon: Heart, color: 'text-red-400' },
  { id: 'education', name: 'Education', icon: MessageCircle, color: 'text-yellow-400' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="hidden lg:block w-64 bg-secondary-800/50 backdrop-blur-sm border-r border-secondary-700 overflow-y-auto custom-scrollbar">
      <div className="p-4">
        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          <h3 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-3">
            Navigation
          </h3>
          
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={category.id === 'all' ? '/' : `/${category.id}`}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  isActive(category.id === 'all' ? '/' : `/${category.id}`)
                    ? 'bg-primary-600 text-white'
                    : 'text-secondary-300 hover:bg-secondary-700 hover:text-secondary-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{category.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Categories */}
        <div className="space-y-2 mb-8">
          <h3 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-3">
            Categories
          </h3>
          
          {streamCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={`/search?category=${category.id}`}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  location.search.includes(`category=${category.id}`)
                    ? 'bg-primary-600 text-white'
                    : 'text-secondary-300 hover:bg-secondary-700 hover:text-secondary-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${category.color}`} />
                <span className="font-medium">{category.name}</span>
              </Link>
            );
          })}
        </div>

        {/* User Stats (if authenticated) */}
        {isAuthenticated && user && (
          <div className="bg-secondary-700/50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-secondary-100 mb-3">
              Your Stats
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-secondary-400 text-sm">Streams</span>
                <span className="text-secondary-100 font-medium">
                  {user._count.stream}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-secondary-400 text-sm">Followers</span>
                <span className="text-secondary-100 font-medium">
                  {user._count.followers}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-secondary-400 text-sm">Following</span>
                <span className="text-secondary-100 font-medium">
                  {user._count.following}
                </span>
              </div>
              
              {/* <div className="flex items-center justify-between">
                <span className="text-secondary-400 text-sm">Watch Time</span>
                <span className="text-secondary-100 font-medium">
                  {Math.floor(user.total_watch_time / 60)}h
                </span>
              </div> */}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          
          <Link
            to="/create-stream"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group text-secondary-300 hover:bg-secondary-700 hover:text-secondary-100"
          >
            <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">+</span>
            </div>
            <span className="font-medium">Create Stream</span>
          </Link>
          
          <Link
            to="/settings"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group text-secondary-300 hover:bg-secondary-700 hover:text-secondary-100"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-secondary-700">
          <p className="text-xs text-secondary-500 text-center">
            StreamGuard V2
            <br />
            AI-Powered Safe Streaming
          </p>
        </div>
      </div>
    </aside>
  );
};
