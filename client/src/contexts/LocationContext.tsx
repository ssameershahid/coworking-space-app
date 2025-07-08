import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface LocationContextType {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  isAdmin: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  
  // Check if user is admin
  const isAdmin = user?.role === 'calmkaaj_admin';
  
  useEffect(() => {
    if (user && !isAdmin) {
      // Non-admin users should use their assigned site
      setSelectedLocation(user.site || 'blue_area');
    } else if (isAdmin) {
      // Admin defaults to 'all' but can switch
      setSelectedLocation('all');
    }
  }, [user, isAdmin]);

  return (
    <LocationContext.Provider value={{ selectedLocation, setSelectedLocation, isAdmin }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}