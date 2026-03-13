import { useMode3Store, MODE3_ROOM_TYPES, type Mode3RoomType } from '@/store/useMode3Store';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed, Sofa, Car, Bed, Bath, Wine,
  Monitor, Building2, Store, Crown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ROOM_ICONS: Record<Mode3RoomType, LucideIcon> = {
  'Kitchen': UtensilsCrossed,
  'Living Room': Sofa,
  'Garage': Car,
  'Bedroom': Bed,
  'Bathroom': Bath,
  'Dining Area': Wine,
  'Home Office': Monitor,
  'Studio Apartment': Building2,
  'Retail Interior': Store,
  'Luxury Showroom': Crown,
};

export function Mode3Setup() {
  const { selectedRoom, setSelectedRoom, setCurrentStep, name, setName } = useMode3Store();

  const handleContinue = () => {
    if (selectedRoom && name.trim()) {
      setCurrentStep(2);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Project Setup</h2>
        <p className="text-xs text-muted-foreground">Name your project and select a room type for the epoxy floor transformation.</p>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Project Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Epoxy Floor Project"
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block">Select Room Type</label>
        <div className="grid grid-cols-2 gap-2">
          {MODE3_ROOM_TYPES.map((room) => {
            const Icon = ROOM_ICONS[room];
            const isSelected = selectedRoom === room;
            return (
              <motion.button
                key={room}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedRoom(room)}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border-2 text-left text-sm transition-all
                  ${isSelected
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30'}
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : ''}`} />
                <span className="font-medium text-xs">{room}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!selectedRoom || !name.trim()}
        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30 transition-opacity"
      >
        Continue to Prompts
      </button>
    </div>
  );
}
