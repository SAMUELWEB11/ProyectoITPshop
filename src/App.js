import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Minus, Plus, Trash2, Loader, LogOut, Package } from 'lucide-react'; 

// === 1. CONFIGURACIÓN Y CONTEXTOS GLOBALES ===

// Asumiendo que las configuraciones globales están disponibles
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// SANEAMIENTO CRÍTICO DE appId: Extraemos solo el ID para evitar que la ruta de Firestore sea inválida
let appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
if (appId.includes('_src')) {
  appId = appId.split('_src')[0]; // Ejemplo: 'c_960b0819c48f8bfb_src/App.js-4' -> 'c_960b0819c48f8bfb'
}

// Inicialización de Firebase (fuera del componente para evitar reinicializaciones)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 1.1 Auth Context ---
const AuthContext = createContext({
  userId: null,
  isLoadingAuth: true,
});

const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const signIn = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase Auth Error:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      setIsLoadingAuth(false);
    });

    if (!auth.currentUser) {
      signIn();
    } else {
      setIsLoadingAuth(false);
    }
    
    return () => unsubscribe();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ userId, isLoadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};


// --- 1.2 Cart Context ---
const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { userId, isLoadingAuth } = useContext(AuthContext);
  
  // Ruta de la colección de Firestore: Ahora es válida (5 segmentos: C/D/C/D/C)
  const cartCollectionPath = `/artifacts/${appId}/users/${userId}/cart`;

  // Cargar carrito desde Firestore al inicio o al cambiar de usuario
  useEffect(() => {
    if (isLoadingAuth || !userId) return;

    // Listener para el carrito en tiempo real
    const q = collection(db, cartCollectionPath);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => {
        items.push(doc.data());
      });
      setCartItems(items);
    }, (error) => {
      console.error("Firestore Cart Snapshot Error:", error);
    });

    return () => unsubscribe();
  }, [userId, isLoadingAuth]);

  // Funciones CRUD del carrito con Firestore
  const saveCartItem = useCallback(async (itemCode, updateData) => {
    if (!userId) return;
    try {
      // Usar itemCode como ID del documento
      const itemRef = doc(db, cartCollectionPath, itemCode);
      await setDoc(itemRef, updateData, { merge: true });
    } catch (e) {
      console.error("Error saving cart item: ", e);
    }
  }, [userId]);

  const increaseQuantity = useCallback((itemCode) => {
    const item = cartItems.find(i => i.item_code === itemCode);
    if (item) {
      saveCartItem(itemCode, { quantity: item.quantity + 1 });
    }
  }, [cartItems, saveCartItem]);

  const decreaseQuantity = useCallback((itemCode) => {
    const item = cartItems.find(i => i.item_code === itemCode);
    if (item && item.quantity > 1) {
      saveCartItem(itemCode, { quantity: item.quantity - 1 });
    } else if (item && item.quantity === 1) {
      removeFromCart(itemCode); // Remove if quantity drops to 0
    }
  }, [cartItems, saveCartItem]);

  const removeFromCart = useCallback(async (itemCode) => {
    if (!userId) return;
    try {
      const itemRef = doc(db, cartCollectionPath, itemCode);
      await deleteDoc(itemRef);
    } catch (e) {
      console.error("Error removing cart item: ", e);
    }
  }, [userId]);
  
  const clearCart = useCallback(async () => {
    if (!userId) return;
    try {
      const q = collection(db, cartCollectionPath);
      const snapshot = await getDocs(q);
      snapshot.forEach(async (d) => {
        await deleteDoc(d.ref);
      });
    } catch (e) {
      console.error("Error clearing cart: ", e);
    }
  }, [userId]);

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const updateQuantity = (itemCode, newQty) => {
    if (newQty > 0) {
      const item = cartItems.find(i => i.item_code === itemCode);
      if (item) {
        saveCartItem(itemCode, { quantity: newQty });
      }
    } else {
      removeFromCart(itemCode);
    }
  }


  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        increaseQuantity, 
        decreaseQuantity, 
        removeFromCart, 
        clearCart,
        getCartTotal,
        totalItems,
        updateQuantity,
        saveCartItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
};


// === 2. COMPONENTES ===

// --- 2.1 Header Component ---
const Header = ({ onOpenCart }) => {
  const { totalItems } = useContext(CartContext);
  const { userId } = useContext(AuthContext);

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Package className="w-8 h-8 text-amber-600" />
          <h1 className="text-2xl font-bold text-gray-800 tracking-wider">ITP Shop</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-lg"
            aria-label="Ver Carrito"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {totalItems}
              </span>
            )}
          </button>
          <span className="text-sm text-gray-600 hidden sm:block truncate max-w-[100px]">
            Usuario: {userId ? userId.substring(0, 8) + '...' : 'Anónimo'}
          </span>
        </div>
      </div>
    </header>
  );
};


// --- 2.2 ProductCard Component ---
const ProductCard = ({ product }) => {
  const { saveCartItem } = useContext(CartContext);

  const handleAddToCart = () => {
    saveCartItem(product.item_code, {
      item_code: product.item_code,
      name: product.name,
      price: product.price,
      quantity: 1, // Start with 1
      image: product.image,
    });
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover object-center"
        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/CCCCCC/333333?text=${product.item_code}`; }}
      />
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-4">Código: {product.item_code}</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">
            ${product.price.toFixed(2)}
          </span>
          <motion.button
            onClick={handleAddToCart}
            className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:bg-amber-700 transition-colors flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Añadir
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};


// --- 2.3 Cart Component (Actualizado para usar Context) ---
const Cart = ({ isOpen, onClose, onCheckout, isProcessing, checkoutMessage }) => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useContext(CartContext);

  // Calculamos el total aquí directamente
  const total = getCartTotal();

  // Función para determinar la clase de color del mensaje de checkout
  const getMessageClass = (msg) => {
    if (msg.startsWith('✅')) return 'text-green-600'; // Éxito
    if (msg.startsWith('❌')) return 'text-red-600'; // Error
    if (msg.startsWith('⚠️')) return 'text-red-600'; // Advertencia (Red de Vercel/API)
    return 'text-gray-700'; // Procesando
  };
  
  if (!isOpen) return null;

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
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 border-b pb-2">
          <h2 className="text-2xl font-bold text-gray-800">Tu Carrito</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-amber-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <AnimatePresence>
          {cartItems.length === 0 ? (
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
              {cartItems.map((item) => (
                <motion.div
                  key={item.item_code}
                  className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={item.image || `https://placehold.co/100x100/A0A0A0/FFFFFF?text=${item.item_code}`} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded" 
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent font-bold">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.item_code, item.quantity - 1)}
                        className="p-1 text-gray-500 hover:text-amber-600 transition-colors"
                        disabled={isProcessing}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-amber-700">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.item_code, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-amber-600 transition-colors"
                        disabled={isProcessing}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.item_code)}
                      className="p-1 text-red-500 hover:text-red-700"
                      disabled={isProcessing}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {/* Pie de página sticky para el total y checkout */}
              <div className="mt-6 pt-4 border-t border-gray-200 sticky bottom-0 bg-white z-10">
                <div className="flex justify-between items-center text-xl font-bold mb-4">
                  <span className="text-gray-800">Total:</span>
                  <span className="bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">
                    ${total.toFixed(2)}
                  </span>
                </div>
                
                {/* Muestra mensajes de estado (éxito o error) */}
                <AnimatePresence>
                  {checkoutMessage && (
                    <motion.p 
                      className={`mt-2 text-center text-sm font-medium ${getMessageClass(checkoutMessage)}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      {checkoutMessage}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={onCheckout}
                  disabled={isProcessing || cartItems.length === 0}
                  className={`w-full mt-4 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex justify-center items-center ${
                    isProcessing || cartItems.length === 0
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


// === 3. COMPONENTE PRINCIPAL (App) ===

// Estado inicial de ejemplo (deberías tener una lista de productos reales de tu ERPNext)
const initialProducts = [
  { item_code: "HOODIE-M", name: "Sudadera con Capucha ITP", price: 450.00, image: "https://placehold.co/100x100/A0A0A0/FFFFFF?text=HOODIE" },
  { item_code: "PHONECASE-X", name: "Funda para Teléfono XT", price: 150.00, image: "https://placehold.co/100x100/C0C0C0/FFFFFF?text=CASE" },
  { item_code: "T-SHIRT-L", name: "Camiseta Logo Grande", price: 250.00, image: "https://placehold.co/100x100/808080/FFFFFF?text=TSHIRT" },
];

const AppContent = () => {
  const [products] = useState(initialProducts); // Lista de productos disponibles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  
  // Accede a las funciones del carrito y la información de Auth
  const { cartItems, clearCart } = useContext(CartContext);
  const { userId, isLoadingAuth } = useContext(AuthContext);

  // ----------------------------------------------------
  // CRÍTICO: LÓGICA DE CHECKOUT (llamada al API de Vercel)
  // ----------------------------------------------------
  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setCheckoutMessage('Procesando pedido...');

    // 1. Prepara el Payload para ERPNext (usa item_code como el ID de ERPNext)
    const salesOrderPayload = {
      customer: 'WEB CUSTOMER ITP', 
      currency: 'MXN', 
      items: cartItems.map(item => ({
        item_code: item.item_code, 
        qty: item.quantity,
        rate: item.price,
      })),
    };

    // 2. Definir una función de fetch con timeout
    const fetchWithTimeout = (url, options, timeout = 15000) => {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), timeout)
        )
      ]);
    };

    try {
      // Intenta llamar a la función Serverless de Vercel
      const response = await fetchWithTimeout('/api/create-sales-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salesOrderPayload),
      });

      // 3. Manejo de errores de red (e.g., 404, 500 del servidor Vercel)
      if (!response.ok) {
        let errorBody = await response.text();
        try {
            const jsonError = JSON.parse(errorBody);
            errorBody = jsonError.message || JSON.stringify(jsonError);
        } catch (e) {
            // No es JSON, usa el texto sin procesar
        }
        setCheckoutMessage(`❌ Error de Servidor Vercel (${response.status}): ${errorBody.substring(0, 100)}...`);
        console.error('Error de Servidor Vercel:', response.status, errorBody);
        return;
      }
      
      // 4. Procesar la respuesta (debe ser JSON de ERPNext/API)
      const result = await response.json();

      if (result.success) {
        setCheckoutMessage(`✅ Pedido creado: ${result.sales_order_name}`);
        clearCart(); // Limpia el carrito al completar
        // Opcional: Cerrar el carrito después de un tiempo
        setTimeout(() => {
          setIsCartOpen(false);
          setCheckoutMessage('');
        }, 3000); 
      } else {
        // Error capturado y devuelto por la función serverless (posiblemente de ERPNext)
        const errorDetail = result.details || result.message || 'Error desconocido sin éxito en la respuesta JSON.';
        setCheckoutMessage(`❌ Error en ERPNext: ${errorDetail}`);
        console.error('Error en el checkout (Respuesta API):', result);
      }
    } catch (error) {
      // 5. Manejo de errores de red o timeout
      let errorMessage;
      if (error.message === 'Request timed out') {
        errorMessage = '⚠️ Solicitud de red agotó el tiempo de espera (15s). Problema de conexión o API muy lenta.';
      } else {
        errorMessage = `⚠️ Error de conexión/red: ${error.message}`;
      }
      setCheckoutMessage(errorMessage);
      console.error('Error de red/fetch:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [cartItems, clearCart, isProcessing]);
  // ----------------------------------------------------

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-700">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header onOpenCart={() => setIsCartOpen(true)} />

      <main className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-8 text-center border-b pb-4">
          Tienda Oficial ITP Shop
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <ProductCard key={product.item_code} product={product} />
          ))}
        </div>
      </main>

      {/* Renderiza el Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <Cart
            isOpen={isCartOpen}
            onClose={() => {
                setIsCartOpen(false);
                setCheckoutMessage(''); // Limpiar el mensaje al cerrar
            }}
            onCheckout={handleCheckout} 
            isProcessing={isProcessing} 
            checkoutMessage={checkoutMessage}
            // Eliminamos la prop 'cart' ya que los datos se obtienen del contexto.
          />
        )}
      </AnimatePresence>

      <footer className="w-full text-center py-6 text-gray-500 text-sm border-t mt-12">
        <p>ITP Shop | Integración ERPNext & Firebase. User ID: {userId}</p>
      </footer>
    </div>
  );
};

// Componente Wrapper para Contextos
const RootApp = () => (
  <AuthProvider>
    <CartProvider>
      <AppContent />
    </CartProvider>
  </AuthProvider>
);

export default RootApp;