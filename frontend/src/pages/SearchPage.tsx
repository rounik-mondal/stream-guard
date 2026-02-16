import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, Users, Clock } from 'lucide-react';
import { useQuery } from 'react-query';
import { api, apiHelpers } from '../services/api';
import { StreamCard } from '../components/Stream/StreamCard';

const categories = [
  'Gaming', 'Music', 'Art', 'Tech', 'Lifestyle', 'Education', 
  'Sports', 'Cooking', 'Travel', 'Fashion', 'Other'
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
  });

  // Fetch streams based on search and filters
  const { data: streams, isLoading, error } = useQuery(
    ['search-streams', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.query) params.append('search', filters.query);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status_filter', filters.status);
      
      const response = await api.get(`/api/streams?${params.toString()}`);
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds for live data
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (filters.query) params.append('q', filters.query);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    
    setSearchParams(params);
  };

  useEffect(() => {
    updateSearchParams();
  }, [filters]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-100 mb-2">Search Streams</h1>
          <p className="text-secondary-400">Find and discover amazing live streams</p>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search streams, users, or content..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="input w-full pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input w-full"
                  aria-label="Filter by category"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input w-full"
                  aria-label="Filter by status"
                >
                  <option value="">All Status</option>
                  <option value="live">Live Now</option>
                  <option value="offline">Offline</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              {/* View Mode */}
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  View Mode
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span>Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>List</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-secondary-100">
                {isLoading ? 'Searching...' : `Found ${streams?.length || 0} streams`}
              </h2>
              {filters.query && (
                <span className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full text-sm">
                  "{filters.query}"
                </span>
              )}
            </div>

            {/* Live Stats */}
            {streams && (
              <div className="flex items-center space-x-6 text-sm text-secondary-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                  <span>{streams.filter((s: any) => s.status === 'live').length} live</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {streams.reduce((total: number, s: any) => total + s.viewer_count, 0)} viewers
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stream Grid/List */}
        {isLoading ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="w-full h-48 bg-secondary-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-secondary-700 rounded mb-2"></div>
                <div className="h-3 bg-secondary-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-medium text-secondary-300 mb-2">
              Search Error
            </h3>
            <p className="text-secondary-500">
              Failed to load streams. Please try again.
            </p>
          </div>
        ) : streams && streams.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {streams.map((stream: any, index: number) => (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <StreamCard 
                  stream={stream} 
                  featured={viewMode === 'list'} 
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-medium text-secondary-300 mb-2">
              No streams found
            </h3>
            <p className="text-secondary-500 mb-6">
              {filters.query 
                ? `No streams match your search for "${filters.query}"`
                : 'No streams available at the moment'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setFilters({ query: '', category: '', status: '' })}
                className="btn-ghost"
              >
                Clear Filters
              </button>
              <Link to="/create-stream" className="btn-primary">
                Create Stream
              </Link>
            </div>
          </div>
        )}

        {/* Popular Searches */}
        {!filters.query && !filters.category && !filters.status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h3 className="text-lg font-semibold text-secondary-100 mb-4">
              Popular Categories
            </h3>
            <div className="flex flex-wrap gap-3">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category}
                  to={`/search?category=${category}`}
                  className="bg-secondary-800 hover:bg-secondary-700 text-secondary-300 hover:text-secondary-100 px-4 py-2 rounded-lg transition-colors"
                >
                  {category}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
