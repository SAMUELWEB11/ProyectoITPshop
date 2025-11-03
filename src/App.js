import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import { initialProducts } from './mock/products';
import { addToCart, updateQuantity, removeFromCart } from './utils/cartHelpers';
import LogoITP from './public/logo-itp.png';

const App = () => {
  const [products] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const handleAddToCart = (product, quantity = 1) => {
    setCart(addToCart(cart, product, quantity));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    setCart(updateQuantity(cart, productId, quantity));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(removeFromCart(cart, productId));
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="bg-gray-50 min-h-screen pt-20">
      <Header cartItemCount={cartItemCount} onCartClick={() => setShowCart(true)} />
      
      <motion.main
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.section
          className="text-center mb-12"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Marco circular grande para el logo, centrado arriba */}
          <motion.div
            className="w-48 h-48 mx-auto mb-6 flex items-center justify-center bg-yellow-100 border-4 border-black rounded-full shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ width: '250px', height: '250px' }} // Tamaño fijo grande, ajusta si quieres responsive
          >
            {/* Placeholder para la imagen del logo - reemplaza src con "/tu-logo.png" para tu imagen real */}
            <img 
              src={LogoITP}
              alt="Logo Instituto Tecnológico de Puebla"
              className="w-full h-full object-cover rounded-full"
            />
          </motion.div>
          
          <h1 className="text-5xl font-bold text-black mb-4">
            Bienvenido a ITPSHOP
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre souvenirs exclusivos de la universidad. ¡Lleva un pedacito de orgullo contigo!
          </p>
        </motion.section>

        <ProductList products={products} onAddToCart={handleAddToCart} />
      </motion.main>

      <AnimatePresence>
        {showCart && (
          <Cart
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onClose={() => setShowCart(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;