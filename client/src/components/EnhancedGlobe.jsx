"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the World component to avoid SSR issues
const World = dynamic(() => import('./ui/globe.jsx').then((m) => m.World), {
  ssr: false,
});

const EnhancedGlobe = () => {
  // Define enhanced globe configuration for black background
  const globeConfig = {
    pointSize: 5,
    globeColor: '#000000', // Pure black for the globe
    showAtmosphere: true,
    atmosphereColor: '#3b82f6', // Blue atmosphere
    atmosphereAltitude: 0.12,
    emissive: '#000000',
    emissiveIntensity: 0.1,
    shininess: 0.8,
    polygonColor: 'rgba(255,255,255,0.7)',
    ambientLight: '#ffffff',
    directionalLeftLight: '#ffffff',
    directionalTopLight: '#ffffff',
    pointLight: '#ffffff',
    arcTime: 1500,
    arcLength: 0.9,
    rings: 3,
    maxRings: 5,
    autoRotate: true,
    autoRotateSpeed: 0.4,
  };

  // Enhanced colors with a more vibrant palette
  const colors = [
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
  ];

  // Function to get a random color from the palette
  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  // Major cities around the world with their coordinates
  const cities = {
    // North America
    newYork: { lat: 40.7128, lng: -74.006, name: "New York" },
    losAngeles: { lat: 34.0522, lng: -118.2437, name: "Los Angeles" },
    toronto: { lat: 43.6532, lng: -79.3832, name: "Toronto" },
    mexicoCity: { lat: 19.4326, lng: -99.1332, name: "Mexico City" },
    chicago: { lat: 41.8781, lng: -87.6298, name: "Chicago" },
    
    // South America
    rioDeJaneiro: { lat: -22.9068, lng: -43.1729, name: "Rio de Janeiro" },
    buenosAires: { lat: -34.6037, lng: -58.3816, name: "Buenos Aires" },
    lima: { lat: -12.0464, lng: -77.0428, name: "Lima" },
    bogota: { lat: 4.7110, lng: -74.0721, name: "Bogota" },
    
    // Europe
    london: { lat: 51.5074, lng: -0.1278, name: "London" },
    paris: { lat: 48.8566, lng: 2.3522, name: "Paris" },
    berlin: { lat: 52.5200, lng: 13.4050, name: "Berlin" },
    rome: { lat: 41.9028, lng: 12.4964, name: "Rome" },
    madrid: { lat: 40.4168, lng: -3.7038, name: "Madrid" },
    amsterdam: { lat: 52.3676, lng: 4.9041, name: "Amsterdam" },
    
    // Asia
    tokyo: { lat: 35.6762, lng: 139.6503, name: "Tokyo" },
    beijing: { lat: 39.9042, lng: 116.4074, name: "Beijing" },
    delhi: { lat: 28.6139, lng: 77.2090, name: "Delhi" },
    mumbai: { lat: 19.0760, lng: 72.8777, name: "Mumbai" },
    singapore: { lat: 1.3521, lng: 103.8198, name: "Singapore" },
    dubai: { lat: 25.2048, lng: 55.2708, name: "Dubai" },
    seoul: { lat: 37.5665, lng: 126.9780, name: "Seoul" },
    hongKong: { lat: 22.3193, lng: 114.1694, name: "Hong Kong" },
    
    // Africa
    cairo: { lat: 30.0444, lng: 31.2357, name: "Cairo" },
    lagos: { lat: 6.5244, lng: 3.3792, name: "Lagos" },
    johannesburg: { lat: -26.2041, lng: 28.0473, name: "Johannesburg" },
    nairobi: { lat: -1.2921, lng: 36.8219, name: "Nairobi" },
    capeTown: { lat: -33.9249, lng: 18.4241, name: "Cape Town" },
    
    // Oceania
    sydney: { lat: -33.8688, lng: 151.2093, name: "Sydney" },
    melbourne: { lat: -37.8136, lng: 144.9631, name: "Melbourne" },
    auckland: { lat: -36.8509, lng: 174.7645, name: "Auckland" },
  };

  // Create connections between cities
  const generateConnections = () => {
    const connections = [];
    const cityKeys = Object.keys(cities);
    
    // Generate 40 connections between random cities
    for (let i = 0; i < 40; i++) {
      const startCityKey = cityKeys[Math.floor(Math.random() * cityKeys.length)];
      let endCityKey = cityKeys[Math.floor(Math.random() * cityKeys.length)];
      
      // Ensure we don't connect a city to itself
      while (startCityKey === endCityKey) {
        endCityKey = cityKeys[Math.floor(Math.random() * cityKeys.length)];
      }
      
      const startCity = cities[startCityKey];
      const endCity = cities[endCityKey];
      
      connections.push({
        order: i % 15, // Group connections into waves
        startLat: startCity.lat,
        startLng: startCity.lng,
        endLat: endCity.lat,
        endLng: endCity.lng,
        arcAlt: 0.2 + Math.random() * 0.5, // Random arc height between 0.2 and 0.7
        color: getRandomColor(),
      });
    }
    
    return connections;
  };

  // State to store the connections
  const [connections, setConnections] = useState([]);

  // Generate connections on component mount
  useEffect(() => {
    setConnections(generateConnections());
  }, []);

  return (
    <div className='relative w-full h-full bg-black'>
      {/* Title overlay */}
      <div className="absolute top-0 left-0 w-full z-10 p-8 text-center">
        <h1 className="text-8xl font-bold text-white mb-2 mt-52 h-24 ">QuickPay</h1>
        <p className="text-white bg-black p-2 w-fit text-lg max-w-2xl mx-auto rounded-xl">Simplifying global payments Powered by <span className="text-white font-bold underline text-xl">Monad</span></p>
      </div>
      
      {/* Globe container */}
      <div className="absolute inset-0 w-full h-full">
        <World data={connections} globeConfig={globeConfig} />
      </div>
    </div>
  );
};

export default EnhancedGlobe;
