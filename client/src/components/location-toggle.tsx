import { useLocationContext } from '@/contexts/LocationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

export function LocationToggle() {
  const { selectedLocation, setSelectedLocation, isAdmin } = useLocationContext();
  
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">Location:</span>
      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          <SelectItem value="blue_area">Blue Area</SelectItem>
          <SelectItem value="i_10">I-10</SelectItem>
        </SelectContent>
      </Select>
      {selectedLocation !== 'all' && (
        <Badge variant="secondary" className="text-xs">
          {selectedLocation === 'blue_area' ? 'Blue Area' : 'I-10'}
        </Badge>
      )}
    </div>
  );
}