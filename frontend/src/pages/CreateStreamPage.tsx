import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Settings, Shield, Calendar, Tag, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const categories = [
  'Gaming', 'Music', 'Art', 'Tech', 'Lifestyle', 'Education', 
  'Sports', 'Cooking', 'Travel', 'Fashion', 'Other'
];

export const CreateStreamPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [] as string[],
    is_public: true,
    scheduled_start: '',
    chat_enabled: true,
    toxic_filter_enabled: true,
    allow_guests: true,
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/api/streams', formData);
      toast.success('Stream created successfully!');
      navigate(`/stream/${response.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create stream';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-100 mb-2">
            Create New Stream
          </h1>
          <p className="text-secondary-400">
            Set up your live stream with AI-powered safety features
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-secondary-100 mb-6 flex items-center space-x-2">
              <Video className="w-5 h-5" />
              <span>Stream Information</span>
            </h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-secondary-300 mb-2">
                  Stream Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Enter your stream title"
                  maxLength={200}
                />
                <p className="text-xs text-secondary-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-secondary-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input w-full h-24 resize-none"
                  placeholder="Describe your stream content..."
                  maxLength={1000}
                />
                <p className="text-xs text-secondary-500 mt-1">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-secondary-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Tags
                </label>
                <form onSubmit={handleAddTag} className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="input flex-1"
                    placeholder="Add a tag"
                    maxLength={20}
                  />
                  <button
                    type="submit"
                    disabled={!newTag.trim() || formData.tags.length >= 5}
                    className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </form>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-primary-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-secondary-500 mt-1">
                  {formData.tags.length}/5 tags
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stream Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-secondary-100 mb-6 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Stream Settings</span>
            </h2>

            <div className="space-y-6">
              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-3">
                  Stream Visibility
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="is_public"
                      value="true"
                      checked={formData.is_public === true}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.value === 'true' }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="text-secondary-100 font-medium">Public</div>
                      <div className="text-sm text-secondary-400">Anyone can find and watch your stream</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="is_public"
                      value="false"
                      checked={formData.is_public === false}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.value === 'true' }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="text-secondary-100 font-medium">Private</div>
                      <div className="text-sm text-secondary-400">Only people with the link can watch</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Chat Settings */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="chat_enabled"
                    checked={formData.chat_enabled}
                    onChange={handleChange}
                    className="text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <div>
                    <div className="text-secondary-100 font-medium">Enable Chat</div>
                    <div className="text-sm text-secondary-400">Allow viewers to send messages</div>
                  </div>
                </label>
              </div>

              {/* AI Protection */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="toxic_filter_enabled"
                    checked={formData.toxic_filter_enabled}
                    onChange={handleChange}
                    className="text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <div>
                    <div className="text-secondary-100 font-medium flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-success-400" />
                      <span>Enable AI Toxic Comment Filtering</span>
                    </div>
                    <div className="text-sm text-secondary-400">
                      Automatically filter toxic and harmful comments
                    </div>
                  </div>
                </label>
              </div>

              {/* Guest Access */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="allow_guests"
                    checked={formData.allow_guests}
                    onChange={handleChange}
                    className="text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <div>
                    <div className="text-secondary-100 font-medium">Allow Guest Comments</div>
                    <div className="text-sm text-secondary-400">Let anonymous users participate in chat</div>
                  </div>
                </label>
              </div>

              {/* Scheduled Start */}
              <div>
                <label htmlFor="scheduled_start" className="block text-sm font-medium text-secondary-300 mb-2">
                  Scheduled Start (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="scheduled_start"
                  name="scheduled_start"
                  value={formData.scheduled_start}
                  onChange={handleChange}
                  className="input w-full"
                />
              </div>
            </div>
          </motion.div>

          {/* AI Protection Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-success-600/10 border border-success-500/20 rounded-lg p-6"
          >
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-success-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-secondary-100 mb-2">
                  AI-Powered Safety Features
                </h3>
                <p className="text-secondary-300 mb-4">
                  StreamGuard V2 automatically analyzes every chat message in real-time using advanced LSTM neural networks.
                </p>
                <ul className="space-y-2 text-sm text-secondary-400">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                    <span>Instant toxic comment detection and filtering</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                    <span>Real-time harassment and hate speech prevention</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                    <span>Sub-50ms response time for seamless chat experience</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="spinner w-5 h-5"></div>
                  <span>Creating Stream...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span>Create Stream</span>
                </div>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};
