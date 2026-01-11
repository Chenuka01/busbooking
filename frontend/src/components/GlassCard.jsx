import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({
  children,
  className = '',
  hover = true,
  animate = true,
  ...props
}) => {
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: hover ? {
      y: -5,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    } : {}
  };

  return (
    <motion.div
      className={`
        relative
        backdrop-blur-md
        bg-white/80
        border border-white/20
        rounded-2xl
        shadow-lg
        ${hover ? 'hover:shadow-2xl' : ''}
        transition-all duration-300
        ${className}
      `}
      variants={animate ? cardVariants : {}}
      initial={animate ? "initial" : {}}
      animate={animate ? "animate" : {}}
      whileHover={hover ? "hover" : {}}
      {...props}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;