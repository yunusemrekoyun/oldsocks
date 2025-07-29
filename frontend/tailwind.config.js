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
        black: "#000000",
        dark1: "#141414",
        dark2: "#1B1B1B",
        white: "#FFFFFF",
        light1: "#F3F3F3",
        light2: "#E1E1E1",
      },
      keyframes: {
        shake: {
          "0%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-10deg)" },
          "50%": { transform: "rotate(10deg)" },
          "75%": { transform: "rotate(-10deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
};