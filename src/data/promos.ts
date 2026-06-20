import { Promo } from '@/types/promo';

export const defaultPromos: Promo[] = [
  {
    id: '1',
    title: '30% de réduction',
    description: 'Code: BIENVENUE30',
    image: '',
    gradient: 'from-pink-500 via-rose-500 to-pink-600',
    cta: 'Commander',
    service: 'transport'
  },
  {
    id: '2',
    title: 'Flash Express',
    description: 'Livraison en moto ultra-rapide',
    image: '',
    gradient: 'from-orange-500 via-red-500 to-pink-600',
    cta: 'Livrer',
    service: 'delivery'
  },
  {
    id: '3',
    title: 'Tombola TAGAPay',
    description: 'Gagnez jusqu\'à 100 000 CDF',
    image: '',
    gradient: 'from-purple-500 via-pink-500 to-purple-600',
    cta: 'Participer',
    service: 'lottery'
  },
  {
    id: '4',
    title: 'Location de véhicules',
    description: 'À partir de 75 000 CDF/jour',
    image: '',
    gradient: 'from-green-500 via-emerald-500 to-green-600',
    cta: 'Réserver',
    service: 'rental'
  },
  {
    id: '5',
    title: 'Achetez. Vendez. On livre.',
    description: 'Marketplace 100% sécurisée',
    image: '',
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    cta: 'Shopping',
    service: 'marketplace'
  },
  {
    id: '6',
    title: 'TAGA Food',
    description: 'Commandez vos plats préférés',
    image: '',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    cta: 'Commander',
    service: 'food'
  }
];
