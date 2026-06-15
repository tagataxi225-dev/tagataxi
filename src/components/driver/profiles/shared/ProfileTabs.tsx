/**
 * 📑 Onglets Navigation Profil - Design Moderne
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, FileText, MapPin, QrCode, Package } from 'lucide-react';
import { VehicleCard } from './VehicleCard';
import { DocumentsSection } from './DocumentsSection';
import { ServiceZonesDisplay } from '../../zones/ServiceZonesDisplay';
import { ServiceZoneSelector } from '../../zones/ServiceZoneSelector';
import { DriverCodeManager } from '../../DriverCodeManager';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProfileTabsProps {
  serviceType: 'taxi' | 'delivery';
  vehicleInfo?: {
    make?: string;
    model?: string;
    plate?: string;
    color?: string;
    photo?: string | null;
    capacity?: string;
  };
}

type TabId = 'vehicle' | 'documents' | 'zones' | 'codes';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

export const ProfileTabs = ({ serviceType, vehicleInfo }: ProfileTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('vehicle');
  const [showZonesModal, setShowZonesModal] = useState(false);

  const themeColor = serviceType === 'taxi' ? 'text-primary' : 'text-green-500';
  const themeBg = serviceType === 'taxi' ? 'bg-primary' : 'bg-green-500';

  const tabs: Tab[] = [
    { id: 'vehicle', label: 'Véhicule', icon: serviceType === 'taxi' ? Car : Package },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'zones', label: 'Zones', icon: MapPin },
    { id: 'codes', label: 'Codes', icon: QrCode }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'vehicle':
        return (
          <VehicleCard
            make={vehicleInfo?.make}
            model={vehicleInfo?.model}
            plate={vehicleInfo?.plate}
            color={vehicleInfo?.color}
            photo={vehicleInfo?.photo}
            capacity={vehicleInfo?.capacity}
            serviceType={serviceType}
          />
        );
      case 'documents':
        return <DocumentsSection serviceType={serviceType} />;
      case 'zones':
        return (
          <div className="space-y-3">
            <ServiceZonesDisplay />
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setShowZonesModal(true)}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Gérer mes zones
            </Button>
          </div>
        );
      case 'codes':
        return <DriverCodeManager />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg
              text-sm font-medium transition-all duration-200
              ${activeTab === tab.id 
                ? `${themeBg} text-white shadow-sm` 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Zones Modal */}
      <Dialog open={showZonesModal} onOpenChange={setShowZonesModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ServiceZoneSelector />
        </DialogContent>
      </Dialog>
    </div>
  );
};
