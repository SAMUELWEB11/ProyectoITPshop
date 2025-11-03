import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const ProductList = ({ products, onAddToCart }) => {
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const categoryProducts = products.filter(p => p.category === category);
        
        return (
          <motion.section
            key={category}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <motion.h2 
              className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent mb-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {category}
            </motion.h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
};

export default ProductList;