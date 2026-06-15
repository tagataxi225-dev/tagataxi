export type StartupContext = "client" | "chauffeur" | "partenaire" | "marketplace" | "admin";

export const getStartupContext = (pathname: string): StartupContext => {
  if (pathname.startsWith("/chauffeur")) return "chauffeur";
  if (pathname.startsWith("/partenaire")) return "partenaire";
  if (pathname.startsWith("/marketplace")) return "marketplace";
  if (pathname.startsWith("/admin")) return "admin";
  return "client";
};
