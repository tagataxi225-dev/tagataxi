import { z } from 'zod';

/**
 * 🔐 SCHÉMA DE VALIDATION SÉCURISÉ - INSCRIPTION PARTENAIRE
 * Validation complète côté client pour empêcher les injections et garantir l'intégrité des données
 */

// Validation téléphone : accepte formats locaux ET internationaux
const phoneRegex = /^(\+?[1-9]\d{1,14}|0\d{9,14})$/;

// Étape 1: Informations entreprise
export const companyInfoSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, { message: "Le nom de l'entreprise doit contenir au moins 2 caractères" })
    .max(100, { message: "Le nom de l'entreprise ne peut pas dépasser 100 caractères" })
    .regex(/^[a-zA-Z0-9\s\-\.']+$/, { 
      message: "Le nom de l'entreprise contient des caractères invalides" 
    }),
  
  contact_email: z
    .string()
    .trim()
    .email({ message: "Adresse email invalide" })
    .max(255, { message: "L'email ne peut pas dépasser 255 caractères" })
    .toLowerCase(),
  
  phone: z
    .string()
    .trim()
    .max(20, { message: "Le numéro de téléphone ne peut pas dépasser 20 caractères" })
    .regex(phoneRegex, { 
      message: "Format invalide. Ex: +243971508000, 0971508000 ou 971508000" 
    })
    .transform((val) => {
      // Auto-formater au format international
      if (val.startsWith('0')) {
        return '+243' + val.substring(1); // RDC par défaut
      }
      if (!val.startsWith('+') && val.match(/^[1-9]/)) {
        return '+243' + val; // Ajouter +243 si manquant
      }
      return val;
    }),
  
  business_type: z.enum(['individual', 'company', 'cooperative', 'association'], {
    errorMap: () => ({ message: "Type d'entreprise invalide" })
  }),
  
  address: z
    .string()
    .trim()
    .max(500, { message: "L'adresse ne peut pas dépasser 500 caractères" })
    .optional(),
});

// Étape 2: Documents et licences (optionnels)
export const documentsSchema = z.object({
  tax_number: z
    .string()
    .trim()
    .max(50, { message: "Le numéro fiscal ne peut pas dépasser 50 caractères" })
    .optional()
    .or(z.literal('')),
});

// Étape 3: Services et zones
export const servicesSchema = z.object({
  service_areas: z
    .array(z.string().trim())
    .min(1, { message: "Veuillez sélectionner au moins une zone de service" })
    .max(10, { message: "Maximum 10 zones de service autorisées" }),
});

// Étape 4: Sécurité (mot de passe)
export const securitySchema = z.object({
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
    .max(72, { message: "Le mot de passe ne peut pas dépasser 72 caractères" })
    .regex(/[A-Z]/, { message: "Le mot de passe doit contenir au moins une majuscule" })
    .regex(/[a-z]/, { message: "Le mot de passe doit contenir au moins une minuscule" })
    .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" }),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Schéma de base sans validation de confirmation de mot de passe
const baseRegistrationSchema = companyInfoSchema
  .merge(documentsSchema)
  .merge(servicesSchema)
  .merge(z.object({
    password: z
      .string()
      .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
      .max(72, { message: "Le mot de passe ne peut pas dépasser 72 caractères" })
      .regex(/[A-Z]/, { message: "Le mot de passe doit contenir au moins une majuscule" })
      .regex(/[a-z]/, { message: "Le mot de passe doit contenir au moins une minuscule" })
      .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" }),
  }));

// Schéma complet avec validation de confirmation
export const fullPartnerRegistrationSchema = baseRegistrationSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type CompanyInfoFormData = z.infer<typeof companyInfoSchema>;
export type DocumentsFormData = z.infer<typeof documentsSchema>;
export type ServicesFormData = z.infer<typeof servicesSchema>;
export type SecurityFormData = z.infer<typeof securitySchema>;
export type FullPartnerRegistrationData = z.infer<typeof fullPartnerRegistrationSchema>;
