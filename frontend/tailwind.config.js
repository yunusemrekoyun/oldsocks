// tailwind.config.js
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@material-tailwind/react/components/**/*.js",
    "./node_modules/@material-tailwind/react/theme/components/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['"Playfair Display"', "serif"],
      },
      colors: {
        black: "#000000", // Tam siyah
        dark1: "#141414", // Koyu gri 1
        dark2: "#1B1B1B", // Koyu gri 2
        white: "#FFFFFF", // Beyaz
        light1: "#F3F3F3", // Açık gri 1
        light2: "#E1E1E1", // Açık gri 2
      },
    },
  },
  plugins: [],
};
