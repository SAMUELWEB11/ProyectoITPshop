import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Minus, Plus, Trash2, Loader, AlertTriangle, Menu } from 'lucide-react'; 

// --- 1. UTILITIES (Funciones de Lógica del Carrito - Inlined) ---
const addToCart = (cart, product, quantity = 1) => {
  const existingItemIndex = cart.findIndex(item => item.id === product.id);

  if (existingItemIndex > -1) {
    // Si existe, actualizar la cantidad
    return cart.map((item, index) =>
      index === existingItemIndex
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  }
  // Si no existe, añadir el nuevo producto
  return [...cart, { ...product, quantity }];
};

const updateQuantity = (cart, productId, newQuantity) => {
  if (newQuantity <= 0) {
    return cart.filter(item => item.id !== productId);
  }
  return cart.map(item =>
    item.id === productId ? { ...item, quantity: newQuantity } : item
  );
};

const removeFromCart = (cart, productId) => {
  return cart.filter(item => item.id !== productId);
};

// --- 2. HEADER Component (Inlined) ---
const Header = ({ cartItemCount, onCartClick }) => {
  return (
    <motion.header 
      className="fixed top-0 left-0 w-full bg-black shadow-lg z-40"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120 }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <h1 className="text-xl font-extrabold text-white tracking-widest">
          ITPSHOP
        </h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => alert("Menú de navegación no implementado.")}
            className="p-2 rounded-full text-white hover:text-amber-500 transition-colors hidden sm:block"
            aria-label="Menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-lg"
            aria-label={`Carrito de compras con ${cartItemCount} artículos`}
          >
            <ShoppingCart className="w-6 h-6" />
            {cartItemCount > 0 && (
              <motion.span
                className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-black transform translate-x-1/2 -translate-y-1/2 bg-yellow-300 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={cartItemCount}
              >
                {cartItemCount}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
};

// --- 3. PRODUCT LIST Item Component (Inlined) ---
const ProductItem = ({ product, onAddToCart }) => (
  <motion.div
    className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 transform hover:scale-[1.02]"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    {/* Placeholder de imagen seguro para la compilación */}
    <img 
      src={product.image}
      alt={product.name} 
      className="w-full h-48 object-cover object-center" 
      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x300/FACC15/000?text=ITP`; }}
    />
    
    <div className="p-5">
      <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
      <p className="text-sm text-gray-600 mb-4">Código: {product.id}</p>
      <div className="flex justify-between items-center">
        <span className="text-3xl font-extrabold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">
          ${product.price.toFixed(2)}
        </span>
        <motion.button
          onClick={() => onAddToCart(product)}
          className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Añadir al Carrito
        </motion.button>
      </div>
    </div>
  </motion.div>
);

// --- 4. PRODUCT LIST Component (Inlined) ---
const ProductList = ({ products, onAddToCart }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductItem key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </section>
  );
};

// --- 5. CART Component (Inlined - Corregido en el turno anterior) ---
const Cart = ({ cart, onUpdateQuantity, onRemoveFromCart, onClose, onCheckout, isProcessing }) => {
  // Cálculo del total inlined para evitar fallos de importación
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
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded" 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/64x64/FACC15/000?text=ITP`; }}
                    />
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
                  onClick={onCheckout}
                  disabled={isProcessing || cart.length === 0}
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


// --- 6. APP COMPONENT ---
const App = () => {
  // Inicializamos productos como un array vacío, y necesitamos el setter
  const [products, setProducts] = useState([]); 
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); 
  
  // NUEVOS ESTADOS para manejar la carga de productos de ERPNext
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState(null);

  // --- LÓGICA DE CARGA DE PRODUCTOS DESDE ERPNEXT ---
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      setProductError(null);
      try {
        // Llamar al nuevo endpoint Serverless: /api/items
        const response = await fetch('/api/items');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudo obtener la lista de productos.`);
        }

        const data = await response.json();
        
        // Mapear la respuesta del ERPNext (asumiendo que devuelve 'item_code' y 'standard_rate')
        const mappedProducts = data.items.map(item => ({
          id: item.item_code,
          name: item.item_name,
          price: item.standard_rate || 0, // Usar 0 si no se define el precio
          // Usar la imagen de ERPNext o un placeholder genérico
          image: item.image || `https://placehold.co/400x300/FACC15/000?text=${item.item_name.substring(0, 3).toUpperCase()}`, 
          // Añade otros campos si son necesarios, como 'description'
        }));

        setProducts(mappedProducts);

      } catch (error) {
        console.error('Error fetching ERPNext items:', error);
        setProductError('No se pudieron cargar los productos. Por favor, verifica el endpoint /api/items y la conexión a ERPNext.');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []); // Se ejecuta solo al montar el componente
  // --- FIN LÓGICA DE CARGA DE PRODUCTOS ---


  const handleAddToCart = (product, quantity = 1) => {
    setCart(addToCart(cart, product, quantity));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    setCart(updateQuantity(cart, productId, quantity));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(removeFromCart(cart, productId));
  };

  // --- FUNCIÓN CRUCIAL: CONEXIÓN SEGURA CON ERPNEXT (SIN MODIFICAR) ---
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío. Añade productos para continuar.');
      return;
    }

    // *** NOTA IMPORTANTE: Customer ID debe ser dinámico ***
    const customerId = 'WEB-CUSTOMER-ITP-PLACEHOLDER'; 
    
    setIsProcessing(true);

    try {
      // 1. Mapear los ítems del carrito al formato esperado por ERPNext
      const salesOrderItems = cart.map(item => ({
        // Es vital que 'item_code' coincida con el código en tu ERPNext
        item_code: item.id.toUpperCase(), 
        item_name: item.name,
        qty: item.quantity,
        rate: item.price,
        amount: item.quantity * item.price,
      }));
      
      const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

      // 2. Construir el Payload completo del Sales Order
      const salesOrderPayload = {
        customer: customerId, 
        selling_price_list: 'Standard Selling', // Ajusta esto a tu ERPNext
        transaction_date: new Date().toISOString().split('T')[0],
        items: salesOrderItems,
        
        // Asume que tienes una Compañía configurada en ERPNext con este nombre
        company: 'ITP SHOP', 
        grand_total: cartTotal,
      };

      // 3. Llamar al Proxy Serverless de Vercel
      const response = await fetch('/api/create-sales-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salesOrderPayload)
      });

      const data = await response.json();

      if (response.ok) {
        // Éxito: Pedido creado en ERPNext
        alert(`🎉 ¡Compra Exitosa! Pedido #${data.sales_order.name} creado en ERPNext. Te redirigiremos a la página de confirmación.`);
        setCart([]); // Limpiar carrito
        setShowCart(false); // Cerrar carrito
      } else {
        // Fallo: Mostrar error de ERPNext
        console.error('Error en Checkout:', data.details);
        alert(`❌ Error al procesar el pedido. Revise la consola para detalles. Mensaje: ${data.error}`);
      }
    } catch (error) {
      console.error('Error de red o desconocido:', error);
      alert('Ocurrió un error inesperado al contactar al servidor. Reintente.');
    } finally {
      setIsProcessing(false);
    }
  };
  // --- FIN LÓGICA DE CONEXIÓN ---

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // URL de placeholder para el logo (sustituye el import fallido)
  const LOGO_PLACEHOLDER_URL = 'https://placehold.co/250x250/000000/FACC15?text=ITP';

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
          <motion.div
            className="w-48 h-48 mx-auto mb-6 flex items-center justify-center bg-yellow-100 border-4 border-black rounded-full shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ width: '250px', height: '250px' }}
          >
            {/* Reemplazamos el import 'LogoITP' por una URL directa */}
            <img 
              src={LOGO_PLACEHOLDER_URL}
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
        
        {/* Lógica de Renderizado de Productos/Estados */}
        <div className="flex justify-center items-center min-h-[400px]">
          {isLoadingProducts && (
            <div className="text-center p-8 bg-white rounded-xl shadow-lg flex flex-col items-center">
              <Loader className="w-8 h-8 text-amber-500 animate-spin mb-3" />
              <p className="text-gray-700 font-semibold">Cargando productos desde ERPNext...</p>
            </div>
          )}

          {productError && (
            <div className="text-center p-8 bg-red-50 rounded-xl shadow-lg border border-red-300 flex flex-col items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mb-3" />
              <p className="text-red-700 font-semibold">{productError}</p>
              <p className="text-sm text-gray-500 mt-2">Asegúrate de que el endpoint '/api/items' esté configurado correctamente.</p>
            </div>
          )}

          {!isLoadingProducts && !productError && products.length > 0 && (
            <ProductList products={products} onAddToCart={handleAddToCart} />
          )}

          {!isLoadingProducts && !productError && products.length === 0 && (
            <p className="text-gray-500 text-lg">No hay productos disponibles en este momento.</p>
          )}
        </div>
      </motion.main>

      <AnimatePresence>
        {showCart && (
          <Cart
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onClose={() => setShowCart(false)}
            onCheckout={handleCheckout} 
            isProcessing={isProcessing} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;