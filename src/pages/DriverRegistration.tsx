import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StreamlinedDriverRegistration } from '@/components/driver/registration/StreamlinedDriverRegistration';
import { Card } from '@/components/ui/card';
import BrandLogo from '@/components/brand/BrandLogo';

const DriverRegistration = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/driver/auth');
  };

  const handleBack = () => {
    navigate('/driver/auth');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Arrière-plan dynamique jaune/orange */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-amber-500/20 dark:from-yellow-600/30 dark:via-orange-600/25 dark:to-amber-600/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(251,191,36,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(251,191,36,0.25),transparent_50%)]" />
      
      {/* Formes géométriques */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-500/15 dark:bg-yellow-600/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-orange-500/15 dark:bg-orange-600/25 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-black shadow-2xl shadow-orange-600/50 dark:shadow-orange-500/60 mb-6 ring-2 ring-orange-500/40 dark:ring-orange-400/50 overflow-hidden">
            <BrandLogo size={60} className="relative z-10" />
          </div>
          
          <h1 className="text-4xl font-bold animate-gradient bg-gradient-to-r from-yellow-700 via-orange-600 to-amber-600 dark:from-yellow-500 dark:via-orange-400 dark:to-amber-400 bg-clip-text text-transparent mb-2">
            Inscription Chauffeur
          </h1>
          
          <p className="text-base text-gray-700 dark:text-gray-200">
            Rejoignez l'équipe Tembea et commencez à gagner
          </p>
        </div>

        {/* Registration Form */}
        <StreamlinedDriverRegistration 
          onSuccess={handleSuccess}
          onBack={handleBack}
        />
      </div>
    </div>
  );
};

export default DriverRegistration;
