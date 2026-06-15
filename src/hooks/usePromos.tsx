import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSeasonalThemeSafe } from '@/contexts/SeasonalThemeContext';
import { Promo } from '@/types/promo';

// ✅ PHASE 5: Optimisé avec useMemo + support saisonnier
export const usePromos = (): Promo[] => {
  const { t } = useLanguage();
  const { currentSeason } = useSeasonalThemeSafe();
  
  return useMemo(() => {
    const basePromos: Promo[] = [
    {
      id: '1',
      title: t('promo.discount_30'),
      description: t('promo.discount_30_desc'),
      image: '',
      gradient: 'from-pink-500 via-rose-500 to-pink-600',
      cta: t('promo.order'),
      service: 'transport'
    },
    {
      id: '2',
      title: t('promo.flash_express'),
      description: t('promo.flash_express_desc'),
      image: '',
      gradient: 'from-orange-500 via-red-500 to-pink-600',
      cta: t('promo.deliver'),
      service: 'delivery'
    },
    {
      id: '3',
      title: t('promo.lottery_kwendapay'),
      description: t('promo.lottery_kwendapay_desc'),
      image: '',
      gradient: 'from-purple-500 via-pink-500 to-purple-600',
      cta: t('promo.participate'),
      service: 'lottery'
    },
    {
      id: '4',
      title: t('promo.vehicle_rental'),
      description: t('promo.vehicle_rental_desc'),
      image: '',
      gradient: 'from-green-500 via-emerald-500 to-green-600',
      cta: t('promo.reserve'),
      service: 'rental'
    },
    {
      id: '5',
      title: t('promo.marketplace_slogan'),
      description: t('promo.marketplace_slogan_desc'),
      image: '',
      gradient: 'from-blue-500 via-indigo-500 to-purple-600',
      cta: t('promo.shopping'),
      service: 'marketplace'
    },
    {
      id: '6',
      title: t('promo.kwenda_food'),
      description: t('promo.kwenda_food_desc'),
      image: '',
      gradient: 'from-orange-500 via-amber-500 to-yellow-500',
      cta: t('promo.order'),
      service: 'food'
    }
  ];

    // Ajouter le slide saisonnier en première position si applicable
    if (currentSeason === 'christmas') {
      return [
        {
          id: 'christmas',
          title: '🎄 Joyeux Noël !',
          description: '-20% sur vos courses pendant les fêtes',
          image: '',
          gradient: 'from-red-600 via-green-700 to-red-600',
          cta: 'Célébrer',
          service: 'transport'
        },
        ...basePromos
      ];
    }

    if (currentSeason === 'newYear') {
      return [
        {
          id: 'newYear',
          title: '🎆 Bonne Année !',
          description: 'Commencez 2026 avec Tembea',
          image: '',
          gradient: 'from-amber-500 via-purple-600 to-indigo-600',
          cta: 'Découvrir',
          service: 'transport'
        },
        ...basePromos
      ];
    }

    return basePromos;
  }, [t, currentSeason]); // ✅ Dépendances: t + currentSeason
};
