import { useContext } from 'react';
import { ValidationContext } from './ValidationContext';
import type { ValidationContextType } from './ValidationContext';

export const useValidationContext = (): ValidationContextType => {
  const context = useContext(ValidationContext);
  
  if (!context) {
    throw new Error('useValidationContext must be used within ValidationProvider');
  }
  
  return context;
};
