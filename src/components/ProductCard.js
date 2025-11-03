import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart } from 'lucide-react';


const ProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
    setQuantity(1); // Resetear después de agregar
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <img 

      src={product.image} 
      alt={product.name} 
      className="w-full h-80 object-cover" 
      
      />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-black mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {product.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-yellow-600">
            ${product.price}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-yellow-400 rounded-lg p-0.5 bg-yellow-50 min-w-[80px]">
              <motion.button
                onClick={handleDecrement}
                className="p-1 text-yellow-600 hover:text-yellow-700 transition-colors rounded"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Minus className="w-3 h-3" />
              </motion.button>
              <span className="px-2 py-0.5 font-semibold text-yellow-700 min-w-[1.5rem] text-center text-sm">
                {quantity}
              </span>
              <motion.button
                onClick={handleIncrement}
                className="p-1 text-yellow-600 hover:text-yellow-700 transition-colors rounded"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-3 h-3" />
              </motion.button>
            </div>
            <motion.button
              onClick={handleAddToCartClick}
              className="bg-yellow-500 text-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-yellow-600 transition-all font-semibold border border-yellow-600 text-sm shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="w-3 h-3" />
              Agregar
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;