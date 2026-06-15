import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModernBottomNavigation } from '@/components/home/ModernBottomNavigation';
import { Bike, Car, Truck, Clock } from 'lucide-react';

interface DeliveryHomeProps {
  onCancel: () => void;
  onContinue: (mode: 'flash' | 'flex' | 'maxicharge', selectedPackageId?: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

type ParcelSize = 'small' | 'medium' | 'large';

const sizes: Array<{
  id: ParcelSize;
  title: string;
  desc: string;
  icon: 'bike' | 'car' | 'truck';
  mode: 'flash' | 'flex' | 'maxicharge';
  tag?: string;
}> = [
  { id: 'small', title: 'Petit colis', desc: '3–5 kg • Enveloppes, petits paquets', icon: 'bike', mode: 'flash', tag: 'Rapide' },
  { id: 'medium', title: 'Moyen colis', desc: '5–15 kg • Cartons moyens', icon: 'car', mode: 'flex', tag: 'Populaire' },
  { id: 'large', title: 'Grand colis', desc: '15–50 kg • Gros colis', icon: 'truck', mode: 'maxicharge' },
];

const DeliveryHome: React.FC<DeliveryHomeProps> = ({ onCancel, onContinue, activeTab = 'home', onTabChange = () => {} }) => {
  const [selectedSize, setSelectedSize] = useState<ParcelSize | null>(null);

  const renderIcon = (name: 'bike' | 'car' | 'truck') => {
    const common = 'w-5 h-5';
    if (name === 'bike') return <Bike className={common} />;
    if (name === 'car') return <Car className={common} />;
    return <Truck className={common} />;
  };

  const handleContinue = () => {
    if (!selectedSize) return;
    const selected = sizes.find(s => s.id === selectedSize)!;
    onContinue(selected.mode, selected.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background animate-fade-in">
      {/* Hero */}
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Faites-vous livrer ce que vous voulez</h1>
          <p className="text-sm opacity-90 mt-1">Rapide, fiable, partout en ville</p>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-5 pb-24">
        {/* En-tête section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Taille du colis</span>
            <span className="text-xs text-primary-foreground/80 bg-primary/30 px-2 py-0.5 rounded">
              Temps réel <Clock className="inline w-3 h-3 ml-1" />
            </span>
          </div>

          {sizes.map(s => (
            <Card
              key={s.id}
              className={`p-4 cursor-pointer transition-all border-2 hover-scale ${
                selectedSize === s.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedSize(s.id)}
              role="button"
              aria-pressed={selectedSize === s.id}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-foreground/90">
                    {renderIcon(s.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{s.title}</h3>
                      {s.tag && <Badge variant="secondary" className="text-xs">{s.tag}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {s.mode === 'flash' ? 'Moto' : s.mode === 'flex' ? 'Voiture' : 'Camion'}
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* Promotions */}
        <section aria-label="Promotions" className="space-y-2">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <Card className="min-w-[260px] p-4 bg-muted/40">
              <div className="text-sm font-medium text-foreground">-50% première livraison</div>
              <p className="text-xs text-muted-foreground">Valable aujourd’hui</p>
            </Card>
            <Card className="min-w-[260px] p-4 bg-muted/40">
              <div className="text-sm font-medium text-foreground">Enveloppe gratuite</div>
              <p className="text-xs text-muted-foreground">Sur les petits colis</p>
            </Card>
          </div>
        </section>
      </main>

      {/* Action */}
      <div className="p-4 border-t bg-background sticky bottom-0">
        <Button
          className="w-full"
          size="lg"
          disabled={!selectedSize}
          onClick={handleContinue}
        >
          {selectedSize ? 'Continuer' : 'Sélectionnez une taille'}
        </Button>
      </div>

      {/* Bottom nav */}
      <ModernBottomNavigation 
        activeTab={activeTab || 'home'}
        onTabChange={(tab) => onTabChange?.(tab)}
      />
    </div>
  );
};

export default DeliveryHome;
