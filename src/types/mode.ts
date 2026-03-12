export type AppMode = 'mode1' | 'mode2';

export type Mode2WorkflowStep = 1 | 2 | 3 | 4 | 5;

export const MODE2_STEP_LABELS: Record<Mode2WorkflowStep, string> = {
  1: 'Setup',
  2: 'Plan',
  3: 'Images',
  4: 'Videos',
  5: 'Download',
};

export type Mode2Path = 'interior' | 'exterior' | null;
export type Mode2Source = 'template' | 'upload' | null;

export interface Mode2SceneData {
  index: number;
  title: string;
  imagePrompt: string;
  generatedImageUrl?: string;
  imageBase64?: string;
  approved: boolean;
  generating: boolean;
}

export interface Mode2TransitionData {
  index: number;
  startSceneIndex: number;
  endSceneIndex: number;
  motionPrompt: string;
  generatedVideoUrl?: string;
  generatedVideoUrl2?: string;
  midpointImageUrl?: string;
  midpointImageBase64?: string;
  operationName?: string;
  generationMode?: string;
  approved: boolean;
  generating: boolean;
}

export const MODE2_SCENE_COUNT = 8;
export const MODE2_TRANSITION_COUNT = 7;

// Interior step titles
export const MODE2_INTERIOR_TITLES: string[] = [
  'Abandoned Room',
  'Cleaning',
  'Wall Repair',
  'Ceiling Repair',
  'Windows & Doors',
  'Flooring',
  'Furniture & Decor',
  'Completed Interior',
];

// Exterior step titles
export const MODE2_EXTERIOR_TITLES: string[] = [
  'Abandoned Exterior',
  'Cleaning',
  'Wall/Facade Repair',
  'Ceiling/Porch Repair',
  'Windows & Doors',
  'Groundwork & Landscaping',
  'Finishing Touches',
  'Completed Exterior',
];

export interface Mode2MaterialMapping {
  walls: string;
  floors: string;
  ceiling: string;
  windows: string;
  doors: string;
  furniture: string;
  lighting: string;
  extras: string;
}

// Template library with real images
export interface Mode2Template {
  id: string;
  name: string;
  imagePath: string;
  category: 'interior' | 'exterior';
  description: string;
}

// Image imports for templates
import intLivingRoom from '@/assets/templates/int-living-room.jpg';
import intBedroom from '@/assets/templates/int-bedroom.jpg';
import intKitchen from '@/assets/templates/int-kitchen.jpg';
import intBathroom from '@/assets/templates/int-bathroom.jpg';
import extHouseFront from '@/assets/templates/ext-house-front.jpg';
import extVilla from '@/assets/templates/ext-villa.jpg';
import extApartment from '@/assets/templates/ext-apartment.jpg';
import extCottage from '@/assets/templates/ext-cottage.jpg';

export const MODE2_TEMPLATES: Mode2Template[] = [
  {
    id: 'int-living-room',
    name: 'Modern Living Room',
    imagePath: intLivingRoom,
    category: 'interior',
    description: 'Spacious living room with large windows and wood flooring',
  },
  {
    id: 'int-bedroom',
    name: 'Master Bedroom',
    imagePath: intBedroom,
    category: 'interior',
    description: 'Cozy bedroom with warm lighting and minimalist design',
  },
  {
    id: 'int-kitchen',
    name: 'Open Kitchen',
    imagePath: intKitchen,
    category: 'interior',
    description: 'Modern kitchen with island counter and sleek cabinets',
  },
  {
    id: 'int-bathroom',
    name: 'Luxury Bathroom',
    imagePath: intBathroom,
    category: 'interior',
    description: 'Marble-tiled bathroom with glass shower and vanity',
  },
  {
    id: 'ext-house-front',
    name: 'House Front',
    imagePath: extHouseFront,
    category: 'exterior',
    description: 'Classic two-story house with front porch and garden',
  },
  {
    id: 'ext-villa',
    name: 'Mediterranean Villa',
    imagePath: extVilla,
    category: 'exterior',
    description: 'White stucco villa with terracotta roof and courtyard',
  },
  {
    id: 'ext-apartment',
    name: 'Apartment Building',
    imagePath: extApartment,
    category: 'exterior',
    description: 'Multi-story apartment with balconies and ground floor shops',
  },
  {
    id: 'ext-cottage',
    name: 'Country Cottage',
    imagePath: extCottage,
    category: 'exterior',
    description: 'Stone cottage with thatched roof and rustic garden',
  },
];
