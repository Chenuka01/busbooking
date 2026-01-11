import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Primary Background - 60% (Ceramic White/Soft Light Gray) */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>

      {/* Animated Mesh Gradient - Professional Tech Look */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, #1E293B 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, #F97316 0%, transparent 50%)',
            'radial-gradient(circle at 40% 80%, #22C55E 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, #1E293B 0%, transparent 50%)'
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0">
        {/* Large Circle */}
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 rounded-full bg-gradient-to-r from-slate-200/10 to-slate-300/5 blur-xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Medium Rectangle */}
        <motion.div
          className="absolute top-40 right-20 w-64 h-32 rounded-lg bg-gradient-to-r from-orange-200/8 to-orange-300/4 blur-lg"
          animate={{
            rotate: [0, 5, -5, 0],
            x: [0, -80, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Small Triangle */}
        <motion.div
          className="absolute bottom-32 left-1/4 w-48 h-48 bg-gradient-to-r from-green-200/6 to-green-300/3 blur-lg"
          style={{
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
          }}
          animate={{
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
            x: [0, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Floating Dots */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-slate-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Bus Route Lines Animation */}
        <motion.svg
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10"
          viewBox="0 0 1200 800"
          fill="none"
        >
          {/* Curved Route Lines */}
          <motion.path
            d="M200,400 Q400,200 600,400 T1000,400"
            stroke="#1E293B"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
          <motion.path
            d="M150,500 Q350,300 550,500 T950,500"
            stroke="#F97316"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.path
            d="M250,350 Q450,150 650,350 T1050,350"
            stroke="#22C55E"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: 2
            }}
          />
        </motion.svg>

        {/* System Name Branding Elements */}
        <motion.div
          className="absolute top-16 right-16 text-slate-600/20 font-bold text-6xl select-none"
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          BUS
        </motion.div>

        <motion.div
          className="absolute bottom-16 left-16 text-slate-600/15 font-bold text-4xl select-none"
          animate={{
            opacity: [0.05, 0.2, 0.05],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          BOOKING
        </motion.div>

        <motion.div
          className="absolute bottom-32 right-32 text-orange-600/10 font-bold text-3xl select-none"
          animate={{
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          SYSTEM
        </motion.div>
      </div>

      {/* Subtle Noise Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default AnimatedBackground;