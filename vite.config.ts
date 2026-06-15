import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { asyncCSSPlugin } from './plugins/vite-plugin-async-css';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement selon le mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Lire la version depuis package.json
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
  const appVersion = packageJson.version || '1.0.0';
  const buildDate = new Date().toISOString();
  
  // Déterminer le manifest selon le type d'app
  const getManifestPath = () => {
    const appType = env.VITE_APP_TYPE;
    if (appType === 'client') return './public/manifest.client.json';
    if (appType === 'driver') return './public/manifest.driver.json';
    if (appType === 'partner') return './public/manifest.partner.json';
    return './public/manifest.json';
  };
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      
      asyncCSSPlugin(),
    ].filter(Boolean),
    build: {
      cssCodeSplit: false, // Un seul fichier CSS pour FCP rapide
      minify: 'esbuild',
      terserOptions: {
        compress: {
          drop_console: true, // Supprimer console.log en prod
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info']
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Regrouper tout @capacitor (core + plugins) dans un seul chunk
            // pour que le registre de plugins s'initialise avant tout appel
            // (corrige "plugin not implemented on android")
            if (id.includes('@capacitor')) return 'capacitor';
            // Conserver les regroupements existants
            if (id.includes('react-router-dom') || /node_modules\/(react|react-dom)\//.test(id)) return 'vendor';
            if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-dropdown-menu') || id.includes('@radix-ui/react-toast')) return 'ui';
            if (id.includes('@googlemaps/react-wrapper') || id.includes('mapbox-gl')) return 'maps';
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Accepter des chunks plus gros pour réduire le nombre de requêtes
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },
    define: {
      // Injecter les variables d'environnement pour les builds spécifiques
      'import.meta.env.VITE_APP_TYPE': JSON.stringify(env.VITE_APP_TYPE),
      'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME),
      'import.meta.env.VITE_APP_ID': JSON.stringify(env.VITE_APP_ID),
      'import.meta.env.VITE_PRIMARY_COLOR': JSON.stringify(env.VITE_PRIMARY_COLOR),
      'import.meta.env.VITE_DEFAULT_ROUTE': JSON.stringify(env.VITE_DEFAULT_ROUTE),
      'import.meta.env.VITE_AUTH_ROUTE': JSON.stringify(env.VITE_AUTH_ROUTE),
      // Injecter la version de l'app dans le Service Worker
      '__APP_VERSION__': JSON.stringify(appVersion),
      '__BUILD_DATE__': JSON.stringify(buildDate),
    }
  };
});
