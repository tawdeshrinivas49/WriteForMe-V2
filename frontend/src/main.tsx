import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AppWithProviders = () => {
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </GoogleOAuthProvider>
    );
  } else {
    // Fallback without Google OAuth – Google login will be hidden/disabled
    return (
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
  }
};

createRoot(document.getElementById("root")!).render(<AppWithProviders />);