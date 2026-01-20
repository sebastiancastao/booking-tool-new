export interface WidgetConfig {
  id: string;
  name: string;
  companyName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  buttonText: string;
  successMessage: string;
  customFields: CustomField[];
  enableInsurance: boolean;
  enableSpecialItems: boolean;
  enableInventory: boolean;
  pricing: PricingConfig;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "number";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Booking {
  id: string;
  widgetId: string;
  status: BookingStatus;

  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Moving Details
  moveDate: string;
  moveTime?: string;
  flexibleDates: boolean;

  // Addresses
  pickupAddress: Address;
  dropoffAddress: Address;

  // Property Details
  pickupPropertyType: PropertyType;
  dropoffPropertyType: PropertyType;
  pickupFloor?: number;
  dropoffFloor?: number;
  pickupElevator: boolean;
  dropoffElevator: boolean;

  // Inventory
  inventory: InventoryItem[];
  estimatedSize?: MoveSize;

  // Special Items
  specialItems: SpecialItem[];

  // Additional Services
  packingService: boolean;
  unpackingService: boolean;
  storageNeeded: boolean;
  storageDuration?: string;

  // Insurance
  insuranceOption?: InsuranceOption;
  declaredValue?: number;

  // Custom Fields
  customFieldValues: Record<string, string | boolean | number>;

  // Notes
  additionalNotes?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type PropertyType =
  | "apartment"
  | "house"
  | "condo"
  | "townhouse"
  | "office"
  | "storage"
  | "other";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category: InventoryCategory;
}

export type InventoryCategory =
  | "bedroom"
  | "living_room"
  | "kitchen"
  | "dining_room"
  | "bathroom"
  | "office"
  | "garage"
  | "outdoor"
  | "other";

export interface SpecialItem {
  id: string;
  name: string;
  description?: string;
  requiresSpecialHandling: boolean;
}

export type MoveSize =
  | "studio"
  | "1br"
  | "2br"
  | "3br"
  | "4br"
  | "5br_plus"
  | "office_small"
  | "office_medium"
  | "office_large";

export type InsuranceOption =
  | "basic"
  | "standard"
  | "premium"
  | "none";

export const MOVE_SIZE_LABELS: Record<MoveSize, string> = {
  studio: "Studio",
  "1br": "1 Bedroom",
  "2br": "2 Bedrooms",
  "3br": "3 Bedrooms",
  "4br": "4 Bedrooms",
  "5br_plus": "5+ Bedrooms",
  office_small: "Small Office",
  office_medium: "Medium Office",
  office_large: "Large Office",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
  condo: "Condo",
  townhouse: "Townhouse",
  office: "Office",
  storage: "Storage Unit",
  other: "Other",
};

export const INSURANCE_OPTIONS: Record<InsuranceOption, { label: string; description: string }> = {
  none: { label: "No Insurance", description: "Basic carrier liability only" },
  basic: { label: "Basic Coverage", description: "$0.60 per pound per item" },
  standard: { label: "Standard Coverage", description: "Up to $10,000 coverage" },
  premium: { label: "Premium Coverage", description: "Full replacement value" },
};

export type PricingTeamOption = {
  rate: number;
  minimumHours: number;
};

export type PricingLaborEstimate = {
  minLabor: number;
  maxLabor: number;
};

export interface PricingConfig {
  teams: {
    move: Record<"2-1" | "3-1" | "3-2" | "4-2", PricingTeamOption>;
    loaders: Record<"loaders-2" | "loaders-3", PricingTeamOption>;
    unloading: Record<"2-1" | "3-1", PricingTeamOption>;
  };
  estimateLabor: {
    home: Record<
      "studio" | "1bed" | "2bed" | "3bed" | "4bed" | "5bed",
      PricingLaborEstimate
    >;
    storage: Record<"25" | "50" | "75" | "100" | "200" | "300", PricingLaborEstimate>;
    office: Record<
      "1-4" | "5-9" | "10-19" | "20-49" | "50-99" | "over-100",
      PricingLaborEstimate
    >;
  };
  travelRate: number;
  pricePerMile: number;
  protectionCharge: number;
  accessibility: {
    noElevatorCharge: number;
    stairsCharge: Record<"1-2" | "3-4" | "5+", number>;
    walkingDistance: Record<"short" | "medium" | "long", number>;
  };
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  teams: {
    move: {
      "2-1": { rate: 120, minimumHours: 2 },
      "3-1": { rate: 180, minimumHours: 3 },
      "3-2": { rate: 220, minimumHours: 2 },
      "4-2": { rate: 300, minimumHours: 2 },
    },
    loaders: {
      "loaders-2": { rate: 120, minimumHours: 2 },
      "loaders-3": { rate: 180, minimumHours: 2 },
    },
    unloading: {
      "2-1": { rate: 0, minimumHours: 2 },
      "3-1": { rate: 0, minimumHours: 2 },
    },
  },
  estimateLabor: {
    home: {
      studio: { minLabor: 2, maxLabor: 3 },
      "1bed": { minLabor: 2.5, maxLabor: 3.5 },
      "2bed": { minLabor: 3, maxLabor: 4 },
      "3bed": { minLabor: 4, maxLabor: 5 },
      "4bed": { minLabor: 5, maxLabor: 6 },
      "5bed": { minLabor: 6, maxLabor: 8 },
    },
    storage: {
      "25": { minLabor: 1, maxLabor: 1.5 },
      "50": { minLabor: 1.5, maxLabor: 2 },
      "75": { minLabor: 2, maxLabor: 2.5 },
      "100": { minLabor: 2.5, maxLabor: 3 },
      "200": { minLabor: 3, maxLabor: 4 },
      "300": { minLabor: 4, maxLabor: 5 },
    },
    office: {
      "1-4": { minLabor: 2, maxLabor: 3 },
      "5-9": { minLabor: 3, maxLabor: 4 },
      "10-19": { minLabor: 4, maxLabor: 5 },
      "20-49": { minLabor: 5, maxLabor: 7 },
      "50-99": { minLabor: 7, maxLabor: 9 },
      "over-100": { minLabor: 10, maxLabor: 12 },
    },
  },
  travelRate: 0.75, // Rate multiplier for travel time (e.g., 0.75 means 75% of hourly rate)
  pricePerMile: 2.5, // Additional charge per mile
  protectionCharge: 15,
  accessibility: {
    noElevatorCharge: 25, // Charge when no elevator available (per location)
    stairsCharge: {
      "1-2": 0,
      "3-4": 25,
      "5+": 50,
    },
    walkingDistance: {
      short: 0,
      medium: 15,
      long: 30,
    },
  },
};

export const DEFAULT_INVENTORY_ITEMS: { name: string; category: InventoryCategory }[] = [
  { name: "Bed (King)", category: "bedroom" },
  { name: "Bed (Queen)", category: "bedroom" },
  { name: "Bed (Twin)", category: "bedroom" },
  { name: "Dresser", category: "bedroom" },
  { name: "Nightstand", category: "bedroom" },
  { name: "Wardrobe", category: "bedroom" },
  { name: "Sofa (3-seater)", category: "living_room" },
  { name: "Sofa (2-seater)", category: "living_room" },
  { name: "Armchair", category: "living_room" },
  { name: "Coffee Table", category: "living_room" },
  { name: "TV Stand", category: "living_room" },
  { name: "Bookshelf", category: "living_room" },
  { name: "Dining Table", category: "dining_room" },
  { name: "Dining Chairs", category: "dining_room" },
  { name: "China Cabinet", category: "dining_room" },
  { name: "Refrigerator", category: "kitchen" },
  { name: "Dishwasher", category: "kitchen" },
  { name: "Microwave", category: "kitchen" },
  { name: "Kitchen Table", category: "kitchen" },
  { name: "Desk", category: "office" },
  { name: "Office Chair", category: "office" },
  { name: "Filing Cabinet", category: "office" },
  { name: "Washer", category: "garage" },
  { name: "Dryer", category: "garage" },
  { name: "Workbench", category: "garage" },
  { name: "Patio Set", category: "outdoor" },
  { name: "Grill", category: "outdoor" },
  { name: "Boxes (Small)", category: "other" },
  { name: "Boxes (Medium)", category: "other" },
  { name: "Boxes (Large)", category: "other" },
];

export const COMMON_SPECIAL_ITEMS = [
  "Piano (Upright)",
  "Piano (Grand)",
  "Pool Table",
  "Hot Tub",
  "Safe (Heavy)",
  "Antique Furniture",
  "Artwork/Paintings",
  "Wine Collection",
  "Aquarium",
  "Gym Equipment",
  "Motorcycle",
];
