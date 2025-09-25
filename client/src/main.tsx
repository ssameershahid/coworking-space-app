import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./utils/sw-registration";

// Register service worker for PWA functionality (only in production)
if (import.meta.env.PROD) {
  registerServiceWorker();
}

try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  console.error("Error rendering app:", error);
  document.getElementById("root")!.innerHTML = '<div style="padding: 20px; text-align: center;"><h2>Application Error</h2><p>Please refresh the page and try again.</p></div>';
}
