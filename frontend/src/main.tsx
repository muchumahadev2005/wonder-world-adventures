import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";
import { initFrontendSentry, Sentry } from "./lib/sentry";

// Initialize Sentry error monitoring (graceful no-op if VITE_SENTRY_DSN not set)
initFrontendSentry();

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-amber-50/50 p-6 text-center">
    <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-amber-100">
      <span className="text-6xl mb-4 block">🦉</span>
      <h2 className="text-2xl font-black text-slate-800 mb-2">Oops! Something went wonky</h2>
      <p className="text-sm text-slate-500 mb-6">
        Ollie the Owl noticed a hiccup. Don't worry, your progress is safe! Let's get you back on track.
      </p>
      <button
        onClick={() => window.location.assign("/")}
        className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all active:scale-95"
      >
        Fly Back Home 🚀
      </button>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </Sentry.ErrorBoundary>
);
