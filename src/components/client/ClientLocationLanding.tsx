import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Car, Users, Zap, Shield } from 'lucide-react';
import { ClientRentalInterface } from '@/pages/ClientRentalInterface';

const ClientLocationLanding = () => {
  const [showFullInterface, setShowFullInterface] = useState(false);

  if (showFullInterface) {
    return <ClientRentalInterface />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Location de Véhicules TAGA</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Louez le véhicule parfait pour vos besoins à Kinshasa, Lubumbashi et Kolwezi. 
          Des tarifs transparents, des véhicules de qualité et un service fiable.
        </p>
        <Button 
          size="lg" 
          onClick={() => setShowFullInterface(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Explorer les véhicules disponibles
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardHeader>
            <Car className="h-12 w-12 text-blue-600 mx-auto mb-2" />
            <CardTitle>Flotte Moderne</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Véhicules récents et bien entretenus pour votre confort et sécurité
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Users className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <CardTitle>Service Client 24/7</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Support disponible à tout moment pour vous accompagner
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Zap className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
            <CardTitle>Réservation Instantanée</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Réservez en quelques clics et récupérez votre véhicule rapidement
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Shield className="h-12 w-12 text-purple-600 mx-auto mb-2" />
            <CardTitle>Assurance Incluse</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Couverture complète pour une tranquillité d'esprit totale
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Économique</CardTitle>
            <CardDescription>À partir de 20,000 CDF/jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Véhicules compacts et économiques</li>
              <li>• Idéal pour les déplacements en ville</li>
              <li>• Climatisation et radio incluses</li>
              <li>• Consommation optimisée</li>
            </ul>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => setShowFullInterface(true)}
            >
              Voir les véhicules
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Confort</CardTitle>
                <CardDescription>À partir de 30,000 CDF/jour</CardDescription>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                Populaire
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Berlines et SUV confortables</li>
              <li>• Équipements haut de gamme</li>
              <li>• GPS et Bluetooth inclus</li>
              <li>• Idéal pour les longs trajets</li>
            </ul>
            <Button 
              className="w-full mt-4"
              onClick={() => setShowFullInterface(true)}
            >
              Voir les véhicules
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Premium</CardTitle>
            <CardDescription>À partir de 50,000 CDF/jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Véhicules de luxe et prestige</li>
              <li>• Service VIP inclus</li>
              <li>• Équipements premium</li>
              <li>• Pour occasions spéciales</li>
            </ul>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => setShowFullInterface(true)}
            >
              Voir les véhicules
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
        <CardContent className="p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Prêt à démarrer votre location ?</h2>
            <p className="text-muted-foreground mb-6">
              Découvrez notre sélection de véhicules disponibles dès maintenant à Kinshasa
            </p>
            <Button 
              size="lg"
              onClick={() => setShowFullInterface(true)}
            >
              Commencer ma réservation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientLocationLanding;