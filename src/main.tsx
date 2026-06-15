import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GlobalInitService } from './services/globalInit'
import { logger } from './utils/logger'
import { ErrorBoundary } from './components/ErrorBoundary'

// 🧹 Unregister ALL service workers unconditionally
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// 🔄 CHUNK RELOAD — Si un import dynamique échoue (chunk introuvable après deploy),
// forcer un rechargement complet pour que le navigateur récupère les nouveaux chunks.
// vite:preloadError est émis par Vite 4.3+ quand un dynamic import() retourne 404/réseau KO.
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

// 🛡️ GLOBAL ERROR HANDLERS - Prevent WebView crashes on Android/iOS
window.addEventListener('unhandledrejection', (event) => {
  logger.error('[Global] Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevents WebView crash
});

window.addEventListener('error', (event) => {
  logger.error('[Global] Uncaught error:', event.error || event.message);
  event.preventDefault(); // Prevents WebView crash
});

// Initialize global services
GlobalInitService.initialize().catch((error) => logger.error('Global init failed', error));

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
