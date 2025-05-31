"use client";
import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="bg-black min-h-screen w-screen relative overflow-x-hidden">
      {/* Navigation menu */}
      <Navbar />
      
      {/* Main content */}
      {children}
    </div>
  );
};

export default Layout;
