import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DriverAide: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-base">Centre d'aide</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Construction className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Page en construction</h2>
        <p className="text-sm text-muted-foreground">Cette fonctionnalité sera disponible prochainement.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Retour</Button>
      </div>
    </div>
  );
};

export default DriverAide;
