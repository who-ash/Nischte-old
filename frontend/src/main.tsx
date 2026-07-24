import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import ciaLogo from "./assets/cia-logo.png";
import { ClerkProvider } from "@clerk/clerk-react";

const link = document.createElement("link");
link.rel = "icon";
link.type = "image/png";
link.href = ciaLogo;
document.head.appendChild(link);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}


ReactDOM.createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClerkProvider>
);
