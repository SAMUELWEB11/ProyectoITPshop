export const addToCart = (cart, product, quantity = 1) => {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    return cart.map(item =>
      item.id === product.id
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  }
  return [...cart, { ...product, quantity }];
};

export const removeFromCart = (cart, productId) => {
  return cart.filter(item => item.id !== productId);
};

export const updateQuantity = (cart, productId, quantity) => {
  if (quantity <= 0) {
    return removeFromCart(cart, productId);
  }
  return cart.map(item =>
    item.id === productId ? { ...item, quantity } : item
  );
};

export const calculateTotal = (cart) => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};