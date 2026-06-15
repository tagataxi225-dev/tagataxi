// ========== DÉBOGUEUR DE TRADUCTIONS (MODE DÉVELOPPEMENT) ==========
// Composant pour identifier visuellement les traductions manquantes

import React, { useState, useEffect } from 'react';
import { validateTranslations, type ValidationResult } from '@/utils/translationValidator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const TranslationDebugger: React.FC = () => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runValidation = async () => {
    setIsLoading(true);
    try {
      const result = await validateTranslations();
      setValidationResult(result);
    } catch (error) {
      console.error('Erreur de validation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      runValidation();
    }
  }, []);

  // Ne s'affiche qu'en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-background/95 backdrop-blur border-2 border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {validationResult?.isValid ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
            Validation Traductions
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={runValidation}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {validationResult && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Clés totales:</span>
                <Badge variant="outline">{validationResult.summary.totalKeys}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Manquantes:</span>
                <Badge 
                  variant={validationResult.summary.missingCount > 0 ? "destructive" : "secondary"}
                >
                  {validationResult.summary.missingCount}
                </Badge>
              </div>
              
              {validationResult.summary.missingCount > 0 && (
                <div className="mt-3 p-2 bg-destructive/10 rounded text-xs">
                  <div className="font-semibold text-destructive mb-1">Clés manquantes:</div>
                  {validationResult.missingTranslations.slice(0, 3).map(missing => (
                    <div key={missing.key} className="text-destructive/80">
                      • {missing.key}
                    </div>
                  ))}
                  {validationResult.missingTranslations.length > 3 && (
                    <div className="text-destructive/60">
                      +{validationResult.missingTranslations.length - 3} autres...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationDebugger;