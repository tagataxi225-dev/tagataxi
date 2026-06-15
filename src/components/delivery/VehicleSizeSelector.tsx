import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface VehicleSize {
  id: string;
  name: string;
  description: string;
  dimensions: string;
  maxWeight: string;
  price: number;
  examples: string[];
}

interface VehicleSizeSelectorProps {
  selectedSize: string;
  onSizeChange: (sizeId: string) => void;
}

const VehicleSizeSelector = ({ selectedSize, onSizeChange }: VehicleSizeSelectorProps) => {
  const vehicleSizes: VehicleSize[] = [
    {
      id: 'tricycle',
      name: 'Tricycle',
      description: 'Petit volume',
      dimensions: '60x40x30 cm',
      maxWeight: '20 kg',
      price: 800,
      examples: ['Cartons moyens', 'Appareils ménagers']
    },
    {
      id: 'size-s',
      name: 'Taille S',
      description: 'Coffre standard',
      dimensions: '80x60x40 cm',
      maxWeight: '40 kg',
      price: 1500,
      examples: ['Télévision', 'Micro-ondes', 'Caisses']
    },
    {
      id: 'size-m',
      name: 'Taille M',
      description: 'Pick-up compact',
      dimensions: '120x80x60 cm',
      maxWeight: '80 kg',
      price: 2500,
      examples: ['Réfrigérateur', 'Lave-linge', 'Matelas']
    },
    {
      id: 'size-l',
      name: 'Taille L',
      description: 'Camionnette',
      dimensions: '200x120x100 cm',
      maxWeight: '150 kg',
      price: 4000,
      examples: ['Gazinière', 'Armoire', 'Canapé']
    },
    {
      id: 'size-xl',
      name: 'Taille XL',
      description: 'Grand camion',
      dimensions: '300x150x150 cm',
      maxWeight: '300 kg',
      price: 6500,
      examples: ['Déménagement', 'Mobilier complet', 'Gros électroménager']
    }
  ];

  return (
    <div className="px-4 py-4">
      <h3 className="font-semibold text-grey-900 mb-3 flex items-center gap-2">
        Choisir la taille du véhicule
        <Badge variant="secondary" className="text-xs">Cargo</Badge>
      </h3>
      <div className="space-y-3">
        {vehicleSizes.map((size) => (
          <Card
            key={size.id}
            className={`p-4 cursor-pointer transition-all duration-200 ${
              selectedSize === size.id
                ? 'border-red-500 bg-red-50 shadow-md'
                : 'border-grey-200 hover:border-grey-300'
            }`}
            onClick={() => onSizeChange(size.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-grey-900">{size.name}</h4>
                  <span className="text-sm text-grey-600">• {size.description}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-grey-600">
                  <div>📏 {size.dimensions}</div>
                  <div>⚖️ Max {size.maxWeight}</div>
                </div>
                <div className="text-xs text-grey-500">
                  <span className="font-medium">Exemples: </span>
                  {size.examples.join(', ')}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-lg text-red-600">
                  {size.price.toLocaleString()} CDF
                </p>
                <p className="text-xs text-grey-500">Prix de base</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VehicleSizeSelector;