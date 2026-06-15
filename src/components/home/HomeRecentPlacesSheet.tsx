import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { MapPin, Home as HomeIcon, Building } from 'lucide-react';
import { usePlaces } from '@/hooks/usePlaces';

interface HomeRecentPlacesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaceSelect: (placeName: string, coordinates?: { lat: number; lng: number }) => void;
}

export const HomeRecentPlacesSheet = ({ open, onOpenChange, onPlaceSelect }: HomeRecentPlacesSheetProps) => {
  const { recentPlaces, homePlace, workPlace, markAsUsed } = usePlaces();

  const places = [
    ...(homePlace ? [homePlace] : []),
    ...(workPlace ? [workPlace] : []),
    ...recentPlaces,
  ];

  const handlePlaceClick = async (place: any) => {
    try {
      await markAsUsed(place.id);
    } catch {}
    onPlaceSelect(place.name, place.coordinates);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="text-xl">Tous les lieux</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(80vh-56px)] px-4 py-4">
          <div className="space-y-2">
            {places.map((place) => (
              <Card 
                key={place.id}
                className="p-3 cursor-pointer border-0 rounded-xl hover:shadow-md transition-all duration-200"
                onClick={() => handlePlaceClick(place)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    {place.place_type === 'home' && <HomeIcon className="h-4 w-4 text-primary" />}
                    {place.place_type === 'work' && <Building className="h-4 w-4 text-primary" />}
                    {(place.place_type === 'recent' || place.place_type === 'favorite') && <MapPin className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{place.name}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default HomeRecentPlacesSheet;
