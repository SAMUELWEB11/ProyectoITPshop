import React, { useState, useContext } from 'react';
import { ShoppingCart, X, Minus, Plus, Loader2, Trash2 } from 'lucide-react'; // Se agregó Trash2 y se usará Loader2 en lugar de Loader
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../App';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

/**
 * Componente funcional para mostrar y gestionar el contenido del carrito de compras.
 * Requiere que se haya inicializado Firebase y que el usuario esté autenticado 
 * (aunque sea anónimamente) para obtener el `userId`.
 */
const Cart = ({ isVisible, onClose }) => {
    // Obtener el contexto del carrito (ítems y funciones de gestión)
    const { 
        cartItems, 
        updateItemQuantity, 
        removeItem, 
        clearCart,
        userId,     // Importado del App.js (después de la autenticación de Firebase)
        db,         // Instancia de Firestore
        // Auth no se usa directamente aquí, se mantiene solo db y userId
    } = useContext(CartContext);

    // Estado para gestionar la carga y mensajes de la compra (equivalente a isProcessing y message)
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Lógica para calcular el total
    const subtotal = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity, 0
    );
    const total = subtotal; // Simplicidad: sin impuestos ni envío por ahora

    /**
     * Función para iniciar el proceso de pago. Llama al proxy seguro de Vercel 
     * para crear la 'Sales Order' en ERPNext.
     */
    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            setMessage({ type: 'error', text: 'El carrito está vacío. Por favor, añada productos antes de proceder al pago.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        // --- 1. Preparar los datos del pedido ---
        const itemsForERP = cartItems.map(item => ({
            item_code: item.item_code, 
            qty: item.quantity,
            rate: item.price,
            item_name: item.name
        }));

        const orderData = {
            customer: "WEB-CUSTOMER-ITP-PLACEHOLDER", 
            selling_price_list: "Standard Selling", 
            transaction_date: new Date().toISOString().split('T')[0], 
            items: itemsForERP,
        };

        // --- 2. Llamada al Proxy (ERPNext) ---
        try {
            // Se usa un retry simple con backoff para estabilidad de red
            let response;
            let result;
            let attempt = 0;
            const maxAttempts = 3;

            while (attempt < maxAttempts) {
                try {
                    response = await fetch('/api/create-sales-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData),
                    });
                    result = await response.json();
                    if (response.ok) break; // Éxito
                } catch (e) {
                    console.error(`Attempt ${attempt + 1} failed:`, e);
                }
                attempt++;
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100)); // Retraso exponencial
                }
            }


            if (response && response.ok) {
                // --- 3. Guardar confirmación en Firestore ---
                if (db && userId) {
                    // Usar un ID de Firestore si ERPNext no devuelve uno inmediatamente
                    const docId = result.order_id || `order-${Date.now()}`;
                    const orderDocRef = doc(db, `artifacts/${window.__app_id}/users/${userId}/orders`, docId);
                    await setDoc(orderDocRef, {
                        ...orderData,
                        erp_status: 'Created',
                        erp_order_id: result.order_id || 'PENDIENTE_ERP',
                        timestamp: new Date()
                    });
                }
                
                setMessage({ 
                    type: 'success', 
                    text: `¡Pedido creado con éxito! ID de ERPNext: ${result.order_id || 'N/A'}.` 
                });
                clearCart(); 
            } else {
                console.error('Error del Servidor ERPNext:', result);
                setMessage({ 
                    type: 'error', 
                    text: `Error al crear el pedido: ${result.error || 'Problema de conexión o datos inválidos.'}` 
                });
            }
        } catch (error) {
            console.error('Error de red/proxy:', error);
            setMessage({ 
                type: 'error', 
                text: 'Error de conexión. Asegúrate de que tu función proxy en Vercel esté configurada (api/create-sales-order.js).' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Estilos de Tailwind CSS para el modal
    // Usamos las variantes de tu código anterior para el efecto de fade/scale
    const cartVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    // Componente de Ítem del Carrito
    const CartItem = ({ item }) => (
        <motion.div 
            key={item.id}
            layout 
            className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            <div className="flex items-center gap-4">
                <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-16 h-16 object-cover rounded shadow-md"
                    onError={(e) => e.target.src = 'https://placehold.co/64x64/CCCCCC/333333?text=ITP'} // Fallback
                />
                <div>
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    {/* Estilo de precio con gradiente, como en tu código anterior */}
                    <p className="bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent font-bold">
                        ${item.price.toFixed(2)}
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Controles de Cantidad */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)} 
                        disabled={item.quantity <= 1}
                        className="p-1 text-gray-500 hover:text-amber-600 transition-colors disabled:opacity-50"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold text-amber-700">{item.quantity}</span>
                    <button 
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)} 
                        className="p-1 text-gray-500 hover:text-amber-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                
                {/* Botón de Remover (usando Trash2 como en tu código anterior) */}
                <button 
                    onClick={() => removeItem(item.id)} 
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Remove item"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={cartVariants}
                    transition={{ type: "tween", duration: 0.2 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" // Modal centralizado de tu código anterior
                >
                    <motion.div 
                        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                        {/* Encabezado del Carrito */}
                        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                <ShoppingCart className="w-6 h-6 mr-2 text-amber-600" />
                                Tu Carrito
                            </h2>
                            <button 
                                onClick={onClose} 
                                className="text-gray-500 hover:text-amber-600 transition-colors"
                                aria-label="Close cart"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Contenido/Lista de Ítems */}
                        <div className="flex-grow space-y-2">
                            <AnimatePresence>
                                {cartItems.length > 0 ? (
                                    cartItems.map(item => (
                                        <CartItem key={item.id} item={item} />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="font-medium">Tu carrito está vacío.</p>
                                        <p className="text-sm">Añade algunos productos ITP para empezar a comprar.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Pie de página (Totales y Checkout) */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            {/* Mensajes de feedback (Éxito/Error) */}
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 mb-4 rounded-lg text-sm font-medium ${
                                        message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {message.text}
                                </motion.div>
                            )}
                            
                            {/* Resumen del Total */}
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span className="text-gray-800">Total:</span>
                                <span className="bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">
                                    ${total.toFixed(2)}
                                </span>
                            </div>

                            {/* Botón de Checkout */}
                            <motion.button
                                onClick={handleCheckout}
                                disabled={cartItems.length === 0 || isLoading}
                                className={`w-full mt-4 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex justify-center items-center ${
                                    cartItems.length === 0 || isLoading
                                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white hover:from-amber-700 hover:to-yellow-600'
                                }`}
                                whileHover={{ scale: isLoading ? 1 : 1.02 }} 
                                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Procesando Pedido...
                                    </>
                                ) : (
                                    'Proceder al Pago'
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Cart;