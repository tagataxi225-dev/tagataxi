import React from 'react';

interface ProductSpecificationsProps {
  specifications?: Record<string, string>;
}

export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({
  specifications
}) => {
  if (!specifications || Object.keys(specifications).length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {Object.entries(specifications).map(([key, value]) => (
        <div key={key} className="flex justify-between items-center text-sm py-1">
          <span className="text-muted-foreground">{key}</span>
          <span className="font-medium text-right">{value}</span>
        </div>
      ))}
    </div>
  );
};
