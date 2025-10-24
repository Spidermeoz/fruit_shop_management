import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative bg-gradient-to-r from-green-400 to-blue-500 text-white">
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <div className="relative container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Fresh Fruits Delivered to Your Door
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Discover the juiciest, most delicious fruits from around the world. 
            Order now and enjoy nature's best treats!
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/products" 
              className="bg-white text-green-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors text-center"
            >
              Shop Now
            </Link>
            <Link 
              to="/products" 
              className="border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:text-green-600 transition-colors text-center"
            >
              View All Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;