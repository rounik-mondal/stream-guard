// src/components/Chat/ChatInterface.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Shield, AlertTriangle, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

// --- FIXED: Updated interface to match backend's camelCase response ---
interface ChatMessage {
  id: number;
  streamId: number;
  authorId?: number;
  guest_id?: string; // Assuming guest logic might use snake_case, keep if needed
  content: string; // Was 'message'
  message_type?: string;
  toxic_score?: number;
  sentiment_score?: number;
  classification?: string;
  is_approved?: boolean;
  isFlagged: boolean; // Was 'is_filtered'
  filter_reason?: string;
  createdAt: string; // Was 'created_at'
  author?: { // Was 'user'
    id: number;
    username: string;
    avatarUrl?: string; // Was 'avatar_url'
  };
}

interface ChatInterfaceProps {
  streamId: number;
  isEnabled: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ streamId, isEnabled }) => {
  const { user, isAuthenticated, isGuest } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Backend sends an array of messages already in the correct camelCase format
        const response = await api.get(`/api/chat/${streamId}/messages?limit=50`);
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [streamId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isLoading || isAnalyzing) return;
    if (!isAuthenticated && !isGuest) {
      toast.error('Please login to send messages');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // First analyze the message
      const analysisResponse = await api.post('/api/chat/analyze', {
        message: newMessage,
      });

      const analysis = analysisResponse.data;
      
      if (analysis.isToxic) { 
        toast.error(`Message blocked: Violates community guidelines`);
        setNewMessage('');
        return;
      }

      // Send the message
      const response = await api.post('/api/chat/send', {
        content: newMessage,
        streamId: streamId,
      });

      // --- FIXED: No mapping needed ---
      // The backend response (response.data) is already in the
      // correct ChatMessage format.
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to send message';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isEnabled) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-secondary-400" />
        </div>
        <h3 className="text-lg font-medium text-secondary-300 mb-2">Chat Disabled</h3>
        <p className="text-secondary-500">The streamer has disabled chat for this stream.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4">
        <AnimatePresence>
          {messages.map((message) => {
            // --- FIXED: Check against 'authorId' ---
            const isOwnMessage = user && message.authorId === user.id;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`chat-message ${
                  isOwnMessage ? 'chat-message-own' : 'chat-message-other'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {/* --- FIXED: Use 'author.avatarUrl' --- */}
                    {message.author?.avatarUrl ? (
                      <img
                        src={message.author.avatarUrl}
                        alt={message.author.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    {/* Username and Time */}
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-secondary-300">
                        {/* --- FIXED: Use 'author.username' --- */}
                        {message.author?.username || message.guest_id || 'Anonymous'}
                      </span>
                      <span className="text-xs text-secondary-500">
                        {/* --- FIXED: Use 'createdAt' --- */}
                        {formatTime(message.createdAt)}
                      </span>
                      {message.classification && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          message.classification === 'toxic' 
                            ? 'bg-accent-500/20 text-accent-400'
                            : message.classification === 'negative'
                            ? 'bg-warning-500/20 text-warning-400'
                            : 'bg-success-500/20 text-success-400'
                        }`}>
                          {message.classification}
                        </span>
                      )}
                    </div>

                    {/* Message Text */}
                    <div className="text-secondary-100 text-sm break-words">
                      {/* --- FIXED: Use 'content' --- */}
                      {message.content}
                    </div>

                    {/* AI Analysis Info */}
                    {message.toxic_score !== undefined && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Shield className="w-3 h-3 text-success-400" />
                        <span className="text-xs text-secondary-500">
                          AI Score: {(message.toxic_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Loading indicator */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="chat-message-system"
          >
            <div className="flex items-center space-x-2">
              <div className="spinner w-4 h-4"></div>
              <span>Analyzing message...</span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={
            isAuthenticated || isGuest 
              ? "Type a message..." 
              : "Login to send messages"
          }
          disabled={!isAuthenticated && !isGuest}
          className="flex-1 input text-sm"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isLoading || isAnalyzing || (!isAuthenticated && !isGuest)}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <div className="spinner w-4 h-4"></div>
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* AI Protection Notice */}
      <div className="mt-3 p-3 bg-success-600/10 border border-success-500/20 rounded-lg">
        <div className="flex items-center space-x-2 text-sm text-success-400">
          <Shield className="w-4 h-4" />
          <span>AI-powered toxic comment filtering is active</span>
        </div>
        <p className="text-xs text-secondary-500 mt-1">
          Messages are analyzed in real-time to maintain a safe environment.
        </p>
      </div>
    </div>
  );
};