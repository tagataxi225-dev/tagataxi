import React from 'react'
import { StreamlinedDriverRegistration } from './StreamlinedDriverRegistration'

interface DriverRegistrationChoiceProps {
  onSuccess: () => void
  onBack: () => void
}

export const DriverRegistrationChoice: React.FC<DriverRegistrationChoiceProps> = ({ 
  onSuccess, 
  onBack 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 flex items-center justify-center p-4">
      <StreamlinedDriverRegistration 
        onSuccess={onSuccess} 
        onBack={onBack} 
      />
    </div>
  )
}