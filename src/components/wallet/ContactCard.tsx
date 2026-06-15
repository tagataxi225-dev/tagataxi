import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Contact {
  user_id: string;
  display_name: string;
  phone_number?: string;
  avatar_color: string;
  last_transfer_date: string;
  total_transfers: number;
}

interface ContactCardProps {
  contact: Contact;
  selected: boolean;
  onClick: () => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  selected,
  onClick
}) => {
  const initials = contact.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isFavorite = contact.total_transfers >= 5;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative p-3 rounded-xl transition-all ${
        selected
          ? 'contact-selected bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-600/20 border-2 border-purple-500'
          : 'bg-muted/50 hover:bg-muted border border-border/30'
      }`}
    >
      {/* Favorite badge */}
      {isFavorite && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-1 shadow-lg"
        >
          <Star className="h-3 w-3 text-white fill-current" />
        </motion.div>
      )}

      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm shadow-md"
        style={{
          background: contact.avatar_color
        }}
      >
        {initials}
      </div>

      {/* Name */}
      <p className="text-xs font-semibold text-foreground truncate">
        {contact.display_name.split(' ')[0]}
      </p>

      {/* Phone (last 4 digits) */}
      {contact.phone_number && (
        <p className="text-[10px] text-muted-foreground">
          ...{contact.phone_number.slice(-4)}
        </p>
      )}

      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 rounded-xl border-2 border-purple-500 pointer-events-none"
        >
          <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full p-1 shadow-lg">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </motion.div>
      )}
    </motion.button>
  );
};
