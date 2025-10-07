import { useEffect, useState } from "react";
import { getCategoriesCached } from "../services/categoryCache";

export default function useCategoriesCache() {
  const [state, setState] = useState({ data: null, loading: true });

  useEffect(() => {
    let mounted = true;

    getCategoriesCached()
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
