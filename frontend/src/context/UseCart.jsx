import { useContext } from "react";
import { CartContext } from "./CartContextObject";

export const useCart = () => useContext(CartContext);
