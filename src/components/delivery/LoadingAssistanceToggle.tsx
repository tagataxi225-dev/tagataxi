import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserX } from 'lucide-react';

interface LoadingAssistanceToggleProps {
  hasAssistance: boolean;
  onToggle: (hasAssistance: boolean) => void;
}

const LoadingAssistanceToggle = ({ hasAssistance, onToggle }: LoadingAssistanceToggleProps) => {
  const assistanceOptions = [
    {
      id: 'no-assistance',
      title: 'Non',
      description: 'Je me charge du chargement/déchargement',
      icon: <UserX className="w-5 h-5" />,
      price: 0,
      selected: !hasAssistance
    },
    {
      id: 'with-assistance',
      title: 'Aide du conducteur',
      description: 'Le conducteur aide au chargement/déchargement',
      icon: <Users className="w-5 h-5" />,
      price: 500,
      selected: hasAssistance
    }
  ];

  return (
    <div className="px-4 py-4">
      <h3 className="font-semibold text-grey-900 mb-3 flex items-center gap-2">
        Aide au chargement
        <Badge variant="outline" className="text-xs">Optionnel</Badge>
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {assistanceOptions.map((option) => (
          <Card
            key={option.id}
            className={`p-4 cursor-pointer transition-all duration-200 ${
              option.selected
                ? 'border-red-500 bg-red-50 shadow-md'
                : 'border-grey-200 hover:border-grey-300'
            }`}
            onClick={() => onToggle(option.id === 'with-assistance')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  option.selected ? 'bg-red-500 text-white' : 'bg-grey-100 text-grey-600'
                }`}>
                  {option.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-grey-900">{option.title}</h4>
                  <p className="text-sm text-grey-600">{option.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-red-600">
                  {option.price > 0 ? `+${option.price.toLocaleString()} CDF` : 'Gratuit'}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LoadingAssistanceToggle;