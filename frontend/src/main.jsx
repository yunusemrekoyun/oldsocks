// src/main.jsx
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import CartProvider from "./context/CartContext.jsx";
import UploadQueueOverlay from "./components/ui/UploadQueueOverlay.jsx";
import { UploadQueueProvider } from "./context/UploadQueueContext.jsx";

const RootWrapper =
  import.meta.env.MODE === "production"
    ? ({ children }) => children
    : StrictMode;

createRoot(document.getElementById("root")).render(
  <RootWrapper>
    <AuthProvider>
      <CartProvider>
        <UploadQueueProvider>
          <App />
          <UploadQueueOverlay />
        </UploadQueueProvider>
      </CartProvider>
    </AuthProvider>
  </RootWrapper>
);
