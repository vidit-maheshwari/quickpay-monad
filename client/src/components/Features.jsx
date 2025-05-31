"use client";
import React from 'react';

const Features = () => {
  return (
    <div className="w-full bg-black py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">Revolutionary Web3 Payments</h2>
        <p className="text-gray-400 text-center max-w-3xl mx-auto mb-16">Experience the future of cryptocurrency transactions with AI-powered simplicity</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-600 transition-all duration-300">
            <div className="bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Natural Language Payments</h3>
            <p className="text-gray-400">Send crypto with simple commands like "Send 0.5 ETH to @alice for dinner"</p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-green-600 transition-all duration-300">
            <div className="bg-green-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Credibility Scoring</h3>
            <p className="text-gray-400">Build your on-chain reputation with our CIBIL-like credibility system</p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-purple-600 transition-all duration-300">
            <div className="bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Rewards</h3>
            <p className="text-gray-400">Earn points and rewards for every transaction you make</p>
          </div>
          
          {/* Feature 4 */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-yellow-600 transition-all duration-300">
            <div className="bg-yellow-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Username System</h3>
            <p className="text-gray-400">Use @usernames instead of complex wallet addresses</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
