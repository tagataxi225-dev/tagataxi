/**
 * Migration pour garantir le mode clair par défaut
 * Force le mode clair pour tous les utilisateurs qui n'ont pas de thème défini
 */
export const migrateToDefaultLightTheme = () => {
  const currentTheme = localStorage.getItem('kwenda-theme');
  
  // Si pas de thème sauvegardé, forcer 'light'
  if (!currentTheme) {
    console.log('☀️ Setting default light theme');
    localStorage.setItem('kwenda-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
};
