"use client";
import React from 'react';

const Marquee = () => {
  const items = [
    "Powered by Monad Blockchain",
    "Fast & Secure Transactions",
    "Low Gas Fees",
    "Decentralized Identity",
    "Web3 Payments Simplified",
    "Global Transactions in Seconds"
  ];

  return (
    <div className="w-full bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 py-4 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {[...items, ...items].map((item, index) => (
          <div key={index} className="mx-8 inline-flex items-center">
            <div className="h-2 w-2 rounded-full bg-blue-400 mr-3"></div>
            <span className="text-gray-200 font-medium">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
