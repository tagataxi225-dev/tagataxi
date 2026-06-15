import type { Plugin } from 'vite';

/**
 * Plugin Vite pour charger le CSS de manière asynchrone
 * Cela évite le blocage du rendu initial de la page
 */
export function asyncCSSPlugin(): Plugin {
  return {
    name: 'vite-plugin-async-css',
    apply: 'build',
    transformIndexHtml(html) {
      // Transformer les liens CSS en preload + async
      return html.replace(
        /<link\s+rel="stylesheet"\s+crossorigin\s+href="([^"]+\.css)">/gi,
        (match, href) => {
          return `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${href}"></noscript>`;
        }
      );
    },
  };
}
