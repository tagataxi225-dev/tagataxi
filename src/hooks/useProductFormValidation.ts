import { useState, useEffect } from 'react';

interface ValidationErrors {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  images?: string;
  condition?: string;
  stock_count?: string;
  brand?: string;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  category: string;
  images: File[];
  condition: string;
  stock_count: number;
  brand?: string;
  specifications?: Record<string, string>;
}

export const useProductFormValidation = (formData: FormData) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    // Champs obligatoires mis à jour
    const requiredFields = ['title', 'description', 'price', 'category', 'images', 'condition', 'stock_count'];
    const completed = requiredFields.filter(field => {
      if (field === 'images') return formData.images.length > 0;
      if (field === 'stock_count') return formData.stock_count >= 1;
      return formData[field as keyof FormData]?.toString().trim();
    });
    
    setCompletionRate(Math.round((completed.length / requiredFields.length) * 100));

    // Validation en temps réel améliorée
    const newErrors: ValidationErrors = {};
    
    // Titre: minimum 5 caractères, pas de maximum
    if (formData.title) {
      if (formData.title.length < 5) {
        newErrors.title = "Minimum 5 caractères";
      }
    }
    
    // Description: minimum 20 caractères, pas de maximum
    if (formData.description) {
      if (formData.description.length < 20) {
        newErrors.description = "Minimum 20 caractères pour bien décrire le produit";
      }
    }
    
    // Prix: doit être > 0
    if (formData.price && Number(formData.price) <= 0) {
      newErrors.price = "Le prix doit être supérieur à 0";
    }
    
    // Images: 1-5 images
    if (formData.images.length === 0) {
      newErrors.images = "Au moins 1 image requise";
    } else if (formData.images.length > 5) {
      newErrors.images = "Maximum 5 images";
    }
    
    // Condition: doit être parmi les valeurs autorisées
    const validConditions = ['new', 'like_new', 'good', 'fair', 'refurbished'];
    if (formData.condition && !validConditions.includes(formData.condition)) {
      newErrors.condition = "État invalide";
    }
    
    // Stock: 1-9999
    if (formData.stock_count < 1) {
      newErrors.stock_count = "Minimum 1 unité";
    } else if (formData.stock_count > 9999) {
      newErrors.stock_count = "Maximum 9999 unités";
    }
    
    // Brand: optionnel, max 50 caractères
    if (formData.brand && formData.brand.length > 50) {
      newErrors.brand = "Maximum 50 caractères";
    }
    
    setErrors(newErrors);
  }, [formData]);

  const isValid = Object.keys(errors).length === 0 && completionRate === 100;

  return { errors, completionRate, isValid };
};
