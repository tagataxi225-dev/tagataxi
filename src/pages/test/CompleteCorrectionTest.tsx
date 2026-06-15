import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  DollarSign, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Navigation,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { universalGeolocation, type CityConfig } from '@/services/universalGeolocation';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import CitySelector from '@/components/location/CitySelector';
import TaxiPaymentModal from '@/components/payment/TaxiPaymentModal';
import TaxiChat from '@/components/transport/TaxiChat';

const MOCK_BOOKING_DATA = {
  id: 'test-booking-001',
  pickup: { address: 'Centre-ville, Kinshasa' },
  destination: { address: 'Aéroport de N\'djili, Kinshasa' },
  actualPrice: 15000,
  distance: 12.5,
  duration: '25 min',
  driverName: 'Jean-Baptiste Kabongo',
  driverRating: 4.8
};

export default function CompleteCorrectionTest() {
  const [currentCity, setCurrentCity] = useState<CityConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testResults, setTestResults] = useState<any>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const { 
    searchLocations, 
    searchResults, 
    searchLoading,
    getCurrentPosition 
  } = useSmartGeolocation();

  useEffect(() => {
    // Détecter la ville au chargement
    const detectCity = async () => {
      try {
        const city = await universalGeolocation.detectUserCity();
        setCurrentCity(city);
        setTestResults(prev => ({
          ...prev,
          cityDetection: { success: true, city: city.name }
        }));
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          cityDetection: { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
        }));
      }
    };

    detectCity();
  }, []);

  const testGeolocation = async () => {
    try {
      const position = await getCurrentPosition();
      setTestResults(prev => ({
        ...prev,
        geolocation: { 
          success: true, 
          position: {
            address: position.address,
            lat: position.lat,
            lng: position.lng,
            source: position.type
          }
        }
      }));
      toast.success('Géolocalisation réussie');
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        geolocation: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        }
      }));
      toast.error('Erreur géolocalisation');
    }
  };

  const testSearch = async () => {
    if (!searchQuery.trim()) {
      toast.warning('Saisissez une recherche');
      return;
    }

    try {
      const results = await searchLocations(searchQuery);
      setTestResults(prev => ({
        ...prev,
        search: { 
          success: true, 
          query: searchQuery,
          resultsCount: results.length,
          city: currentCity?.name,
          results: results.slice(0, 3)
        }
      }));
      toast.success(`${results.length} résultats trouvés`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        search: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        }
      }));
      toast.error('Erreur recherche');
    }
  };

  const testCityChange = (city: CityConfig) => {
    try {
      const newCity = universalGeolocation.setCity(city.code);
      setCurrentCity(newCity);
      setTestResults(prev => ({
        ...prev,
        cityChange: { 
          success: true, 
          newCity: newCity.name,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      toast.success(`Ville changée: ${newCity.name}`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        cityChange: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        }
      }));
      toast.error('Erreur changement de ville');
    }
  };

  const testPayment = () => {
    setShowPaymentModal(true);
    setTestResults(prev => ({
      ...prev,
      paymentModal: { 
        success: true, 
        opened: true, 
        timestamp: new Date().toLocaleTimeString() 
      }
    }));
  };

  const testChat = () => {
    setShowChatModal(true);
    setTestResults(prev => ({
      ...prev,
      chatModal: { 
        success: true, 
        opened: true, 
        timestamp: new Date().toLocaleTimeString() 
      }
    }));
  };

  const handlePaymentComplete = (paymentData: any) => {
    setTestResults(prev => ({
      ...prev,
      paymentComplete: { 
        success: true, 
        method: paymentData.method,
        amount: paymentData.amount,
        tip: paymentData.tip,
        rating: paymentData.rating
      }
    }));
    toast.success('Test paiement réussi !');
  };

  const renderTestResult = (testName: string, result: any) => {
    if (!result) return null;

    return (
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/20">
        {result.success ? (
          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
        )}
        <div className="flex-1 text-sm">
          <p className="font-medium">{testName}</p>
          {result.success ? (
            <div className="text-green-600 space-y-1">
              {result.city && <p>Ville: {result.city}</p>}
              {result.position && (
                <p>Position: {result.position.address} (via {result.position.source})</p>
              )}
              {result.resultsCount !== undefined && (
                <p>Résultats: {result.resultsCount} trouvés</p>
              )}
              {result.newCity && <p>Nouvelle ville: {result.newCity}</p>}
              {result.method && <p>Méthode: {result.method}</p>}
              {result.opened && <p>Interface ouverte avec succès</p>}
            </div>
          ) : (
            <p className="text-red-600">{result.error}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Tests de Correction Complète</h1>
        <p className="text-muted-foreground">
          Validation de la géolocalisation universelle, du système de paiement et du chat intégré
        </p>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="font-medium">Ville détectée:</span>
              <Badge variant="secondary">
                {currentCity?.name || 'Détection en cours...'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tests de Géolocalisation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Géolocalisation Universelle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                onClick={testGeolocation} 
                className="w-full"
                variant="outline"
              >
                Tester Position GPS
              </Button>
              
              <div className="space-y-2">
                <CitySelector 
                  currentCity={currentCity}
                  onCityChange={testCityChange} 
                />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Rechercher un lieu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && testSearch()}
                />
                <Button 
                  onClick={testSearch}
                  disabled={searchLoading}
                  size="sm"
                >
                  {searchLoading ? 'Recherche...' : 'Chercher'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.slice(0, 3).map((result, index) => (
                    <div key={index} className="p-2 bg-muted/10 rounded text-xs">
                      <p className="font-medium">{result.title}</p>
                      <p className="text-muted-foreground">{result.subtitle}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Résultats des tests</h4>
              {renderTestResult('Détection de ville', testResults.cityDetection)}
              {renderTestResult('Position GPS', testResults.geolocation)}
              {renderTestResult('Changement de ville', testResults.cityChange)}
              {renderTestResult('Recherche contextuelle', testResults.search)}
            </div>
          </CardContent>
        </Card>

        {/* Tests Paiement & Chat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Paiement & Communication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                onClick={testPayment}
                className="w-full"
                variant="outline"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Tester Paiement Post-Course
              </Button>
              
              <Button 
                onClick={testChat}
                className="w-full"
                variant="outline"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Tester Chat Client-Chauffeur
              </Button>

              <div className="p-3 bg-muted/10 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Données de test</h5>
                <div className="text-xs space-y-1">
                  <p><span className="font-medium">Course:</span> {MOCK_BOOKING_DATA.pickup.address} → {MOCK_BOOKING_DATA.destination.address}</p>
                  <p><span className="font-medium">Prix:</span> {MOCK_BOOKING_DATA.actualPrice.toLocaleString()} CDF</p>
                  <p><span className="font-medium">Chauffeur:</span> {MOCK_BOOKING_DATA.driverName} ({MOCK_BOOKING_DATA.driverRating}⭐)</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Résultats des tests</h4>
              {renderTestResult('Modal de paiement', testResults.paymentModal)}
              {renderTestResult('Modal de chat', testResults.chatModal)}
              {renderTestResult('Paiement complété', testResults.paymentComplete)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Résumé des Corrections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">✅ Géolocalisation Universelle</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Recherche dynamique par ville détectée</li>
                <li>• Sélecteur de ville manuel</li>
                <li>• Cache optimisé</li>
                <li>• Fallbacks intelligents</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">✅ Système de Paiement</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• TembeaPay wallet intégré</li>
                <li>• Mobile Money support</li>
                <li>• Paiement espèces</li>
                <li>• Pourboires et évaluations</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">✅ Chat Universel</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Intégration dans toutes les courses</li>
                <li>• Messages rapides contextuels</li>
                <li>• Partage de localisation</li>
                <li>• Bouton d'appel direct</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showPaymentModal && (
        <TaxiPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingData={MOCK_BOOKING_DATA}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {showChatModal && (
        <TaxiChat
          bookingId="test-booking-001"
          driverId="test-driver-001"
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
}