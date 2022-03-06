import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // Verify if exists on LocalStorage a register as RocketShoes:cart
    const storageCart = localStorage.getItem('@RocketShoes:cart')
    if (storageCart) {
      return JSON.parse(storageCart);
    }
    return [];
  });

  // ------------------------------
  // After rendering the page, useRef verifies if the previous value
  // on the cart is the same as the current value. If not, apply 
  // the current value to the object Cart
  const prevCartRef = useRef<Product[]>()

  useEffect(() => {
    // Stores the mutable value of Cart on the useRef property .current
    prevCartRef.current = cart
  })

  // As we cannot keep monitoring the reference to set the cart previous 
  // value, a validation through the nullish coalescing operator must 
  // solve the undefined value to the .current property when the page
  // is loaded
  const cartPreviousValue = prevCartRef.current ?? cart

  useEffect(() => {
    // So, when useRef denote a modification on cart
    // the localStorage could be redefined
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    }
  })
  // ------------------------------

  const addProduct = async (productId: number) => {
    try {

      const currCart = [...cart]

      // Verify if the selected product exists in the cart
      const isProductOnCart = currCart.find(product => product.id === productId)
      const prevProductAmountOnCart = isProductOnCart ? isProductOnCart.amount : 0

      // Load stock and get the product amount available on it
      const productStock = await api.get<Stock>(`stock/${productId}`)
      const productAmountOnStock = productStock.data.amount

      // Update the current product amount on cart
      const currProductAmountOnCart = prevProductAmountOnCart + 1

      // Verify if product is available in the stock
      if (currProductAmountOnCart > productAmountOnStock) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      // If exists, add quantity to this product, or else, add product to the cartSize
      if (isProductOnCart) {
        isProductOnCart.amount = currProductAmountOnCart
      } else {

        const stockProduct = await api.get<Product>(`products/${productId}`)

        const addProductIntoCart = {
          ...stockProduct.data,
          amount: currProductAmountOnCart
        }

        currCart.push(addProductIntoCart)

      }

      // Update cart
      setCart(currCart)

    } catch {
      // Add an error message on failure to add a product into the cart
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // Verify if product exists on cart
      const currCart = [...cart]
      const productIdx = currCart.findIndex(product => product.id === productId)

      // If exists remove, else throw error
      if (productIdx >= 0) {

        // Remove from productIdx to itself
        currCart.splice(productIdx, 1)

        // Update cart
        setCart(currCart)

      } else {
        throw Error()
      }

    } catch {
      // Add an error message on failure to remote a product from the cart
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      // If has no amount, escape
      if (amount <= 0) {
        return
      }

      // Load stock and get the product amount available on it
      const productStock = await api.get<Stock>(`stock/${productId}`)
      const productAmountOnStock = productStock.data.amount

      // Verify if product is available in the stock
      if (amount > productAmountOnStock) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      // Verify if the selected product exists in the cart
      const currCart = [...cart]
      const isProductOnCart = currCart.find(product => product.id === productId)

      // If product on cart update cart
      if (isProductOnCart) {
        isProductOnCart.amount = amount
        setCart(currCart)
      } else {
        throw Error()
      }

    } catch {
      // Add an error message on failure to update a product on the cart
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
