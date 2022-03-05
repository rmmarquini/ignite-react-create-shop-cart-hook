import { createContext, ReactNode, useContext, useState } from 'react';
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

  const addProduct = async (productId: number) => {
    try {

      const currCart = [...cart]

      // verify if the selected product exists in the cart
      const isProductOnCart = currCart.find(product => product.id === productId)
      const prevProductAmountOnCart = isProductOnCart ? isProductOnCart.amount : 0

      // load stock and get the product amount available on it
      const productStock = await api.get<Stock>(`stock/${productId}`)
      const productAmountOnStock = productStock.data.amount

      // update the current product amount on cart
      const currProductAmountOnCart = prevProductAmountOnCart + 1

      // verify if product is available in the stock
      if (currProductAmountOnCart > productAmountOnStock) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      // if exists, add quantity to this product, or else, add product to the cartSize
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

      setCart(currCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(currCart))

    } catch {
      // Add an error message on failure to add a product into the cart
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO: verify if product exists on cart
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
      // TODO
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
