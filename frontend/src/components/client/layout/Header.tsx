import React, { useState } from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="https://i.imgur.com/8Jk3l7n.jpg" alt="Logo" className="h-10 w-10 rounded-full mr-3" />
              <span className="text-2xl font-bold text-green-600">FreshFruits</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-green-600 transition font-medium">Trang chủ</Link>
            <Link to="/product" className="text-gray-700 hover:text-green-600 transition font-medium">Sản phẩm</Link>
            <Link to="/about" className="text-gray-700 hover:text-green-600 transition font-medium">Giới thiệu</Link>
            <Link to="/contact" className="text-gray-700 hover:text-green-600 transition font-medium">Liên hệ</Link>
          </nav>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link 
              to="/cart" 
              className="relative p-2 text-gray-700 hover:text-green-600 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
            </Link>
            
            {/* CTA Button */}
            <button className="hidden sm:block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300">
              Đặt hàng ngay
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-green-600 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-green-600 transition font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link 
                to="/product" 
                className="text-gray-700 hover:text-green-600 transition font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sản phẩm
              </Link>
              <Link 
                to="/about" 
                className="text-gray-700 hover:text-green-600 transition font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Giới thiệu
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-700 hover:text-green-600 transition font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Liên hệ
              </Link>
              <Link 
                to="/cart" 
                className="text-gray-700 hover:text-green-600 transition font-medium flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Giỏ hàng (3)
              </Link>
              <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 w-full">
                Đặt hàng ngay
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;