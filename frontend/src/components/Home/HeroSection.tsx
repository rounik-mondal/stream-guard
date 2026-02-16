import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Shield, Users, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const HeroSection: React.FC = () => {
  const { isAuthenticated, isGuest } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-primary-900/20 to-secondary-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-radial-hero"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-primary-600/20 text-primary-400 px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Shield className="w-4 h-4" />
              <span>AI-Powered Safe Streaming</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl lg:text-6xl font-bold text-secondary-100 mb-6"
            >
              Stream with{' '}
              <span className="gradient-text">Confidence</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-secondary-300 mb-8 max-w-2xl"
            >
              Join StreamGuard V2, the first live streaming platform with real-time 
              AI-powered toxic comment filtering. Create, watch, and enjoy safe streaming.
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-6 mb-8"
            >
              <div className="flex items-center space-x-2 text-secondary-400">
                <Zap className="w-5 h-5 text-primary-400" />
                <span>Real-time AI filtering</span>
              </div>
              <div className="flex items-center space-x-2 text-secondary-400">
                <Users className="w-5 h-5 text-primary-400" />
                <span>Safe community</span>
              </div>
              <div className="flex items-center space-x-2 text-secondary-400">
                <Shield className="w-5 h-5 text-primary-400" />
                <span>Harassment-free</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {isAuthenticated || isGuest ? (
                <Link to="/create-stream" className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2 group">
                  <Play className="w-5 h-5" />
                  <span>Start Streaming</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link to="/register" className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2 group">
                  <Play className="w-5 h-5" />
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              
              <Link to="/search" className="btn-ghost text-lg px-8 py-4 flex items-center justify-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Explore Streams</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Content - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Main Visual */}
            <div className="relative bg-gradient-to-br from-secondary-800 to-secondary-900 rounded-2xl p-8 border border-secondary-700 shadow-2xl">
              {/* Chat Interface Mockup */}
              <div className="bg-secondary-900 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-accent-500 rounded-full animate-pulse"></div>
                  <span className="text-secondary-100 font-medium">Live Chat</span>
                  <div className="flex-1"></div>
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                </div>
                
                {/* Chat Messages */}
                <div className="space-y-3">
                  <div className="chat-message-other">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">U</span>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-400 mb-1">User123</div>
                        <div className="text-secondary-100">Great stream! Love the content</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="chat-message-system">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-warning-400" />
                      <span>Message filtered by AI safety system</span>
                    </div>
                  </div>
                  
                  <div className="chat-message-own">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Y</span>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-400 mb-1">You</div>
                        <div className="text-secondary-100">Thanks for watching everyone!</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Input */}
                <div className="mt-4 flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 input text-sm"
                    disabled
                  />
                  <button className="btn-primary px-4 py-2 text-sm" disabled>
                    Send
                  </button>
                </div>
              </div>

              {/* AI Filter Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-400">99.8%</div>
                  <div className="text-xs text-secondary-400">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-400">&lt;50ms</div>
                  <div className="text-xs text-secondary-400">Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-400">1.2K</div>
                  <div className="text-xs text-secondary-400">Filtered</div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary-500/30"
            >
              <Shield className="w-8 h-8 text-primary-400" />
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -bottom-4 -left-4 w-12 h-12 bg-accent-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-accent-500/30"
            >
              <Zap className="w-6 h-6 text-accent-400" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
