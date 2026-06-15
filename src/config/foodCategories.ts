import { 
  Utensils, 
  Coffee, 
  IceCream, 
  Wine,
  Pizza,
  Beef,
  Fish,
  Salad,
  Sandwich,
  type LucideIcon 
} from 'lucide-react';

export interface FoodCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  emoji: string;
  description?: string;
  color: string;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  {
    id: 'entrees',
    name: 'Entrées',
    icon: Salad,
    emoji: '🥗',
    color: 'text-green-600',
    description: 'Salades, soupes, amuse-bouches'
  },
  {
    id: 'plats',
    name: 'Plats principaux',
    icon: Utensils,
    emoji: '🍽️',
    color: 'text-orange-600',
    description: 'Viandes, poissons, plats complets'
  },
  {
    id: 'grillades',
    name: 'Grillades',
    icon: Beef,
    emoji: '🍗',
    color: 'text-red-600',
    description: 'BBQ, poulet braisé, mishkaki'
  },
  {
    id: 'pizza_pates',
    name: 'Pizza & Pâtes',
    icon: Pizza,
    emoji: '🍕',
    color: 'text-yellow-600',
    description: 'Pizzas, pâtes, italien'
  },
  {
    id: 'poissons',
    name: 'Poissons',
    icon: Fish,
    emoji: '🐟',
    color: 'text-blue-600',
    description: 'Poissons, fruits de mer'
  },
  {
    id: 'desserts',
    name: 'Desserts',
    icon: IceCream,
    emoji: '🍰',
    color: 'text-pink-600',
    description: 'Pâtisseries, glaces, fruits'
  },
  {
    id: 'boissons',
    name: 'Boissons',
    icon: Wine,
    emoji: '☕',
    color: 'text-purple-600',
    description: 'Boissons chaudes, froides, alcoolisées'
  },
  {
    id: 'fast_food',
    name: 'Fast-food',
    icon: Sandwich,
    emoji: '🍔',
    color: 'text-amber-600',
    description: 'Burgers, frites, sandwichs'
  }
];

export const getCategoryById = (id: string): FoodCategory | undefined => {
  return FOOD_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category?.name || 'Catégorie inconnue';
};
