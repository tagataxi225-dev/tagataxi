import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DestinationSearchBarProps {
  onFocus: () => void;
  placeholder?: string;
}

export default function DestinationSearchBar({ onFocus, placeholder = "Où allez-vous ?" }: DestinationSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        onFocus={onFocus}
        readOnly
        className="pl-12 h-14 text-base bg-muted/50 border-border rounded-2xl focus:bg-background focus:ring-2 focus:ring-primary cursor-pointer"
      />
    </div>
  );
}
