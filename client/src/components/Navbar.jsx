"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Chat', path: '/chat' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Setup', path: '/setup' },
    // { name: 'Profile', path: '/profile' },
    { name: 'Rewards', path: '/rewards' },
  ];

  return (
    <div className="fixed top-2 left-0 right-0 z-50 flex justify-center mt-6">
      <div className="bg-white dark:bg-black rounded-full px-6 py-3 flex items-center space-x-6 shadow-md">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path} 
            className={`font-bold text-sm transition-colors ${
              pathname === item.path 
                ? 'text-blue-600' 
                : 'text-black dark:text-white hover:text-blue-600'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
