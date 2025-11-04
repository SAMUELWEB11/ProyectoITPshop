import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, Loader } from 'lucide-react'; // Se agregó Loader para el estado de carga
// Se eliminó la importación de '../utils/cartHelpers' para evitar el error de compilación

// Recibimos las nuevas props: onCheckout y isProcessing
const Cart = ({ cart, onUpdateQuantity, onRemoveFromCart, onClose, onCheckout, isProcessing }) => {
  // Calculamos el total aquí directamente para asegurar la compilación
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Tu Carrito</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-amber-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <AnimatePresence>
          {cart.length === 0 ? (
            <motion.p
              className="text-center text-gray-500 py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Tu carrito está vacío. ¡Empieza a comprar!
            </motion.p>
          ) : (
            <>
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent font-bold">
                        ${item.price}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-500 hover:text-amber-600 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-amber-700">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-amber-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveFromCart(item.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-gray-800">Total:</span>
                  <span className="bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <motion.button
                  // --- CONEXIÓN AL CHECKOUT SEGURO ---
                  onClick={onCheckout}
                  disabled={isProcessing || cart.length === 0} // Deshabilitado si procesando o carrito vacío
                  className={`w-full mt-4 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex justify-center items-center ${
                    isProcessing || cart.length === 0
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white hover:from-amber-700 hover:to-yellow-600'
                  }`}
                  whileHover={{ scale: isProcessing ? 1 : 1.02 }} 
                  whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Procesando Pedido...
                    </>
                  ) : (
                    'Proceder al Pago'
                  )}
                </motion.button>
              </div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default Cart;