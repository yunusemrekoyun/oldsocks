import { createContext, useContext } from "react";

export const defaultStorefrontSettings = {
  fontPreset: "classic",
  heroButtonOpacity: 30,
  sections: {
    new: { heading: "Yeni Eklenen Ürünler", source: "latest", categoryId: null, productIds: [], shuffle: true },
    featured: { heading: "Öne Çıkan Ürünler", source: "random", categoryId: null, productIds: [], shuffle: true },
    popular: { heading: "Çok Satan Ürünler", source: "best_selling", categoryId: null, productIds: [], shuffle: false },
  },
  bestSellingProductIds: [],
};

export const StorefrontSettingsContext = createContext(defaultStorefrontSettings);
export const useStorefrontSettings = () => useContext(StorefrontSettingsContext);
