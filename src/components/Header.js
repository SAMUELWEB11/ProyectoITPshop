import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import LogoITP from '../public/logo-itp.png';

const Header = ({ cartItemCount, onCartClick }) => {
  return (
    <motion.header
      className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src={LogoITP}
            alt="Logo ITP"
            className="h-12 w-auto rounded-full"
          />
          <motion.h1
            className="text-3xl font-bold text-black"
            whileHover={{ scale: 1.05 }}
          >
            ITPSHOP
          </motion.h1>
        </div>
        <motion.button
          onClick={onCartClick}
          className="relative p-2 bg-yellow-200 text-black rounded-full hover:bg-yellow-300 transition-colors border border-yellow-400"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </motion.button>
      </div>
    </motion.header>
  );
};

export default Header;