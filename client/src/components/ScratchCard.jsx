"use client";
import React, { useRef, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

// Token color mappings for visual styling
const tokenColors = {
  'TRUMP': { primary: '#FF6B6B', secondary: '#FF8E8E', icon: '🦅' },
  'DAK': { primary: '#4ECDC4', secondary: '#7BE0D6', icon: '🌟' },
  'CHOG': { primary: '#F9C80E', secondary: '#FBDA6C', icon: '🔮' },
  'MOYAKI': { primary: '#9D4EDD', secondary: '#B77FE8', icon: '🔥' },
  'GMON': { primary: '#06D6A0', secondary: '#5EEBC5', icon: '🌈' },
};

const ScratchCard = ({ reward, onClose }) => {
  const canvasRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratchStarted, setIsScratchStarted] = useState(false);
  const [percentScratched, setPercentScratched] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Setup canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Create gradient background for scratch-off overlay
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2C3E50');
    gradient.addColorStop(1, '#1A1A2E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add a more sophisticated texture pattern
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3;
      const opacity = Math.random() * 0.2;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add coin icon and text
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw a coin shape
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 20, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw $ symbol on coin
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#2C3E50';
    ctx.fillText('$', width / 2, height / 2 - 20);
    
    // Add text below coin
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('SCRATCH TO WIN!', width / 2, height / 2 + 30);
    
    // Draw a fancy border with rounded corners
    ctx.strokeStyle = '#FFD700'; // Gold color
    ctx.lineWidth = 6;
    const radius = 15;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.stroke();
    
    // Setup scratch tracking
    const scratchedPixels = new Set();
    const totalPixels = width * height;
    
    // Handle scratching
    let isDrawing = false;
    
    const scratch = (x, y) => {
      if (!isScratchStarted) {
        setIsScratchStarted(true);
      }
      
      const radius = 20;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Track scratched pixels (approximation)
      for (let i = x - radius; i < x + radius; i++) {
        for (let j = y - radius; j < y + radius; j++) {
          if (i >= 0 && i < width && j >= 0 && j < height) {
            const pixelIndex = j * width + i;
            scratchedPixels.add(pixelIndex);
          }
        }
      }
      
      // Calculate percentage scratched
      const newPercentScratched = Math.min(100, Math.floor((scratchedPixels.size / totalPixels) * 100 * 3));
      setPercentScratched(newPercentScratched);
      
      // Auto-reveal when enough is scratched
      if (newPercentScratched >= 50 && !isRevealed) {
        revealReward();
      }
    };
    
    const startDrawing = (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      scratch(x, y);
    };
    
    const draw = (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      scratch(x, y);
    };
    
    const stopDrawing = () => {
      isDrawing = false;
    };
    
    // Touch events
    const touchStart = (e) => {
      e.preventDefault();
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      scratch(x, y);
    };
    
    const touchMove = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      scratch(x, y);
    };
    
    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', touchStart);
    canvas.addEventListener('touchmove', touchMove);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', touchStart);
      canvas.removeEventListener('touchmove', touchMove);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, []);
  
  // Function to reveal the reward
  const revealReward = () => {
    if (isRevealed) return;
    
    setIsRevealed(true);
    setShowConfetti(true);
    
    // Trigger multiple confetti bursts for a more impressive effect
    const colors = [tokenColors[reward.currency]?.primary || '#FFD700', tokenColors[reward.currency]?.secondary || '#FFF'];
    
    // First burst
    confetti({
      particleCount: 80,
      spread: 100,
      colors: colors,
      origin: { y: 0.6 }
    });
    
    // Second burst after a short delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 80,
        colors: colors,
        origin: { x: 0, y: 0.6 }
      });
    }, 200);
    
    // Third burst from the other side
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 80,
        colors: colors,
        origin: { x: 1, y: 0.6 }
      });
    }, 400);
  };
  
  // Get token-specific styling
  const tokenStyle = tokenColors[reward.currency] || { primary: '#6366F1', secondary: '#818CF8', icon: '🪙' };
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4 w-[350px]">
        {/* Card container with shadow effect */}
        <div className="absolute inset-0 rounded-xl shadow-lg overflow-hidden" style={{ zIndex: 0 }}></div>
        
        {/* Canvas for scratch-off layer */}
        <canvas 
          ref={canvasRef} 
          width={350} 
          height={250} 
          className="rounded-xl cursor-pointer shadow-xl"
          style={{ zIndex: 2 }}
        />
        
        {/* Reward display underneath the scratch layer */}
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-xl transition-all duration-700 ${
            isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{
            background: `radial-gradient(circle, ${tokenStyle.secondary} 0%, ${tokenStyle.primary} 100%)`,
            boxShadow: isRevealed ? `0 0 30px ${tokenStyle.primary}40` : 'none',
            zIndex: 1
          }}
        >
          <motion.div 
            className="text-white text-center p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="text-7xl mb-4">{tokenStyle.icon}</div>
            <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
            <div className="bg-white/20 rounded-lg p-3 mb-3">
              <p className="text-4xl font-bold">{reward.amount} {reward.currency}</p>
            </div>
            <p className="text-sm">has been added to your rewards</p>
          </motion.div>
        </div>
      </div>
      
      {/* Progress indicator */}
      {!isRevealed && isScratchStarted && (
        <div className="w-full max-w-[350px] mb-4">
          <div className="w-full bg-gray-800 rounded-full h-3 shadow-inner overflow-hidden border border-gray-700">
            <div 
              className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400" 
              style={{ width: `${percentScratched}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-400">
              Keep scratching!
            </p>
            <p className="text-xs font-medium" style={{ color: tokenStyle.secondary }}>
              {percentScratched}% revealed
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        {isRevealed ? (
          <motion.button
            onClick={onClose}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Claim Reward!
          </motion.button>
        ) : (
          <motion.button
            onClick={revealReward}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Reveal Reward
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default ScratchCard;
