import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { SecureVaultDashboard } from '@/components/secure-vault/SecureVaultDashboard';
import { useLanguage } from '@/contexts/LanguageContext';

export const EscrowPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('escrow.back_home')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('escrow.title')}</h1>
            <p className="text-muted-foreground">
              {t('escrow.subtitle')}
            </p>
          </div>
        </div>

        {/* Dashboard principal */}
        <SecureVaultDashboard />
      </div>
    </div>
  );
};