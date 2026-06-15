import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActivePromos } from '@/hooks/useActivePromos';
import { Tag, Copy, ArrowLeft, Search, Zap, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type confetti from 'canvas-confetti';
declare const confetti: typeof import('canvas-confetti').default;

const PromosPage = () => {
  const navigate = useNavigate();
  const { promos, loading } = useActivePromos();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    toast.success(`Code ${code} copié !`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredPromos = promos.filter(promo =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/client')}
            className="text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Tag className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Promotions</h1>
              <p className="text-white/90">Profitez de nos offres exclusives</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6 -mt-8">
        {/* Recherche */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un code promo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des promos */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPromos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Tag className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Aucune promotion disponible pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPromos.map((promo, index) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {promo.service_type === 'transport' ? (
                              <Zap className="h-6 w-6 text-primary" />
                            ) : (
                              <TrendingUp className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-black text-primary">
                                {promo.code}
                              </span>
                              {copiedCode === promo.code && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold">
                                  Copié !
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {promo.description || 'Code promotionnel'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                            <Tag className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              -{promo.discount_value}{promo.discount_type === 'percentage' ? '%' : ' CDF'}
                            </span>
                          </div>
                          
                          {promo.min_order_amount > 0 && (
                            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-muted-foreground">
                              Min. {promo.min_order_amount.toLocaleString('fr-FR')} CDF
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Expire le {new Date(promo.valid_until).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCopyCode(promo.code)}
                        size="lg"
                        className="gap-2 shrink-0"
                      >
                        <Copy className="h-5 w-5" />
                        Copier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromosPage;
