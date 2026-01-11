import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import { useToast } from '../context/ToastContext';

const ContactSupport = ({ onBack }) => {
  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const supportNumber = '0787178584';

  const handleWhatsAppClick = () => {
    const text = message || 'Hello, I need help with bus booking system';
    const url = `https://wa.me/${supportNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showToast('success', 'Opening WhatsApp...');
  };

  const handleCallClick = () => {
    window.location.href = `tel:${supportNumber}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-slate-blue mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            📞 Contact Support
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            We're here to help you 24/7
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* WhatsApp Support Card */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 h-full">
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <span className="text-4xl">💬</span>
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-blue mb-2">WhatsApp Support</h3>
                <p className="text-gray-600 mb-4">Chat with us instantly</p>
                <motion.button
                  onClick={handleWhatsAppClick}
                  className="w-full px-6 py-3 bg-signal-green text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Open WhatsApp
                </motion.button>
              </motion.div>
            </GlassCard>
          </motion.div>

          {/* Phone Support Card */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 h-full">
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center"
                  animate={{
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                >
                  <span className="text-4xl">📱</span>
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-blue mb-2">Call Support</h3>
                <p className="text-gray-600 mb-2">Available 24/7</p>
                <p className="text-2xl font-bold text-coral mb-4">{supportNumber}</p>
                <motion.button
                  onClick={handleCallClick}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Call Now
                </motion.button>
              </motion.div>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Message Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-slate-blue mb-6">Send a Message via WhatsApp</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-signal-green focus:border-transparent resize-none"
                />
              </div>
              <motion.button
                onClick={handleWhatsAppClick}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(34, 197, 94, 0.3)' }}
                whileTap={{ scale: 0.98 }}
              >
                💬 Send via WhatsApp
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Support Info */}
        <motion.div
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard className="p-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <span className="text-4xl">⏰</span>
            </motion.div>
            <h4 className="font-bold text-slate-blue mt-3">24/7 Available</h4>
            <p className="text-sm text-gray-600 mt-2">Round the clock support</p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-4xl">⚡</span>
            </motion.div>
            <h4 className="font-bold text-slate-blue mt-3">Fast Response</h4>
            <p className="text-sm text-gray-600 mt-2">Quick reply guaranteed</p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-4xl">💯</span>
            </motion.div>
            <h4 className="font-bold text-slate-blue mt-3">Expert Team</h4>
            <p className="text-sm text-gray-600 mt-2">Professional assistance</p>
          </GlassCard>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-slate-blue mb-6">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {[
                {
                  q: "How do I cancel my booking?",
                  a: "Go to 'My Bookings' and click the 'Cancel' button next to your booking."
                },
                {
                  q: "When will I receive my booking confirmation?",
                  a: "Booking confirmation is sent immediately via email after successful payment."
                },
                {
                  q: "Can I change my seat after booking?",
                  a: "Please contact support via WhatsApp to request seat changes."
                },
                {
                  q: "What payment methods are accepted?",
                  a: "We accept all major payment methods including cards and mobile payments."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  className="border-b border-gray-200 pb-4 last:border-0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <h4 className="font-semibold text-slate-blue mb-2">{faq.q}</h4>
                  <p className="text-gray-600 text-sm">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Back Button */}
        {onBack && (
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.button
              onClick={onBack}
              className="px-8 py-3 bg-gray-200 text-slate-blue rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Home
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ContactSupport;