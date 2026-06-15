import React from 'react';
import SlideDeliveryInterface from './SlideDeliveryInterface';

interface StepByStepDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const StepByStepDeliveryInterface = ({ onSubmit, onCancel }: StepByStepDeliveryInterfaceProps) => {
  // Utilise maintenant l'interface moderne avec navigation par slides
  // Géolocalisation intelligente, pricing automatique, UI glassmorphism, navigation fluide
  return <SlideDeliveryInterface onSubmit={onSubmit} onCancel={onCancel} />;
};

export default StepByStepDeliveryInterface;