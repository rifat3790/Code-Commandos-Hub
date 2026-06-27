'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function GlobalPendingModal() {
  const { pendingModal, closePendingModal } = useWorkspaceStore();

  return (
    <AnimatePresence>
      {pendingModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePendingModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-gray-900 border border-glass-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Top decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-600" />
            
            <div className="p-6 pt-8 text-center">
              <button 
                onClick={closePendingModal}
                className="absolute top-4 right-4 p-1 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>

              <h3 className="text-xl font-bold text-white mb-3">
                Request Submitted
              </h3>
              
              <p className="text-gray-300 leading-relaxed mb-8">
                {pendingModal.message}
              </p>

              <button
                onClick={closePendingModal}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg glow-green transition-all"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
