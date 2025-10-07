import { useEffect, useState } from "react";
import { getProductsCached } from "../services/productCache";

export default function useProductsCache() {
  const [state, setState] = useState({ data: null, loading: true });

  useEffect(() => {
    let mounted = true;

    getProductsCached()
      .then((data) => {
        if (mounted) {
          setState({ data, loading: false });
        }
      })
      .catch(() => {
        if (mounted) {
          setState({ data: [], loading: false });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
