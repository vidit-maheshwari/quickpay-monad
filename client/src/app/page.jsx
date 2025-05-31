"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';

// Dynamically import components to avoid SSR issues
const EnhancedGlobe = dynamic(() => import('@/components/EnhancedGlobe'), {
  ssr: true,
});

const Features = dynamic(() => import('@/components/Features'), {
  ssr: true,
});

const Marquee = dynamic(() => import('@/components/Marquee'), {
  ssr: true,
});

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: true,
});

const Page = () => {  
  return (
    <div className='bg-black min-h-screen w-screen relative overflow-x-hidden'>
      {/* Navigation menu */}
      <Navbar />
      
      {/* Globe visualization */}
      <div className="h-screen">
        <EnhancedGlobe />
      </div>
      
      {/* Marquee section */}
      <Marquee />
      
      {/* Features section */}
      <Features />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Page;
