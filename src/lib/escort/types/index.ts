export * from './gender';

export interface ContactMethodEntry { 
    value: string; 
    type: string; 
}

export interface CustomRateEntry { 
    serviceName: string; 
    duration: string; 
    incallPrice: string; 
    outcallPrice: string; 
}

export interface MediaItem {
    id: number;
    base64: string;
    order: number;
}

export interface DaySlot {
    start: string;
    end: string;
}

export interface DaySlots {
    [key: string]: DaySlot[];
}

// Form data interface
export interface FormData {
    // Personal info
    name: string;
    surname: string;
    displayName: string;
    email: string;
    code: string;
    age: string;
    gender: Gender;
    privatePhoneNumber: string;
    publicPhoneNumber: string;
    idNumber: string;
    password: string;
    confirmPassword: string;
    documentation: string;
    
    // Physical attributes
    heightInCm: string;
    weightInKg: string;
    nationality: string;
    hairColor: string;
    eyeColor: string;
    skinColor: string;
    ethnicity: string;
    bust: string;
    waist: string;
    hips: string;
    breastSize: string;
    buttSize: string;
    waxingLevel: string;
    penisSize: string;
    
    // Services
    selectedServices: Set<string>;
    selectedFantasies: Set<string>;
    selectedMassages: Set<string>;
    selectedVirtual: Set<string>;
    
    // Pricing
    hourPriceAmount: string;
    hourPriceCurrency: string;
    customRates: CustomRateEntry[];
    
    // Description
    description: string;
    
    // Contact and availability
    contactMethods: ContactMethodEntry[];
    onlyVirtual: boolean;
    onlyInPerson: boolean;
    ownApartment: boolean;
    motels: boolean;
    clientPlace: boolean;
    scheduleText: string;
    daySlots: DaySlots;
    
    // Location
    country: string;
    state: string;
    city: string;
    hood: string;
    
    // Media
    profilePicBase64: string;
    pics: MediaItem[];
    videos: MediaItem[];
    audioClipBase64: string;
    kycIdPhoto: string;
    kycIdFront: string;
    kycIdBack: string;
}