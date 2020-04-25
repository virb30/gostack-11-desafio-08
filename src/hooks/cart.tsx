import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const items = await AsyncStorage.getItem('@GoMarketplace:products');

      if (items) {
        setProducts(JSON.parse(items));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function storeProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    storeProducts();
  }, [products]);

  const addToCart = useCallback(product => {
    setProducts(state => {
      const exists = state.find(item => product.id === item.id);

      if (exists) {
        exists.quantity += 1;
        return state.map(item => {
          if (item.id === product.id) {
            return { ...product, quantity: exists.quantity };
          }

          return { ...product, quantity: 1 };
        });
      }

      return [...state, { ...product, quantity: 1 }];
    });
  }, []);

  const increment = useCallback(
    id => {
      const items = products.map(product => {
        if (product.id === id) {
          const newQuantity = product.quantity + 1;

          return { ...product, quantity: newQuantity };
        }

        return product;
      });

      setProducts(items);
    },
    [products],
  );

  const decrement = useCallback(
    id => {
      const items = products
        .map(product => {
          if (product.id === id) {
            const newQuantity = product.quantity - 1;

            return { ...product, quantity: newQuantity };
          }

          return product;
        })
        .filter(item => item.quantity !== 0);

      setProducts(items);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
