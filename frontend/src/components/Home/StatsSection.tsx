import React from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Zap, MessageCircle } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '10K+',
    label: 'Active Streamers',
    color: 'text-primary-400',
    bgColor: 'bg-primary-600/20',
  },
  {
    icon: Shield,
    value: '99.8%',
    label: 'AI Accuracy',
    color: 'text-success-400',
    bgColor: 'bg-success-600/20',
  },
  {
    icon: Zap,
    value: '<50ms',
    label: 'Response Time',
    color: 'text-warning-400',
    bgColor: 'bg-warning-600/20',
  },
  {
    icon: MessageCircle,
    value: '1M+',
    label: 'Messages Filtered',
    color: 'text-accent-400',
    bgColor: 'bg-accent-600/20',
  },
];

export const StatsSection: React.FC = () => {
  return (
    <section className="py-16 bg-secondary-800/30 border-y border-secondary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                  className={`text-3xl lg:text-4xl font-bold ${stat.color} mb-2`}
                >
                  {stat.value}
                </motion.div>
                <div className="text-secondary-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
