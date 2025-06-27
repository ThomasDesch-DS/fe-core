import { api } from './apiClient';

// Types for API requests
export interface UpdateAppearanceRequest {
    heightInCm?: number;
    weightInKg?: number;
    hairColor?: string;
    eyeColor?: string;
    skinColor?: string;
    breastSize?: string;
    buttSize?: string;
    waxingLevel?: string;
    penisSize?: string | null;
    bust?: number;
    waist?: number;
    hips?: number;
}

export interface ScheduleSlot {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
}

export interface UpdateAvailabilityRequest {
    onlyVirtual?: boolean;
    onlyInPerson?: boolean;
    ownApartment?: boolean;
    motels?: boolean;
    clientPlace?: boolean;
    schedule?: ScheduleSlot[];
}

export interface MediaItem {
    url: string;
    order: number;
}

export interface UpdateMediaRequest {
    profilePic?: string;
    photosToAdd?: MediaItem[];
    photosToRemove?: MediaItem[];
    videosToAdd?: MediaItem[];
    videosToRemove?: MediaItem[];
    audioToAdd?: string;
    audioToRemove?: string | null;
}

export interface HourPrice {
    amount?: number;
    currency?: string;
}

export interface CustomRate {
    description: string;
    price: number;
}

export interface UpdateServicesInfoRequest {
    escortServices?: string[];
    escortFantasies?: string[];
    massageType?: string[];
    virtualServices?: string[];
    hourPrice?: HourPrice;
    customRate?: CustomRate[];
}

export interface ContactMethodRequest {
    type: string;
    value: string;
}

export interface UpdateInfoRequest {
    displayName?: string;
    publicPhoneNumber?: string;
    description?: string;
}

export interface UpdateLocationRequest {
    country: string;
    state: string;
    city: string;
    hood: string;
}

// API Functions
export async function updateInfo(data: UpdateInfoRequest) {
    return api.patch('/info', data);
}

export async function updateAppearance(data: UpdateAppearanceRequest) {
    return api.patch('/appearance', data);
}

export async function updateAvailability(data: UpdateAvailabilityRequest) {
    return api.patch('/availability', data);
}

export async function updateMedia(data: UpdateMediaRequest) {
    return api.patch<{ files: string[] }>('/media', data);
}

export async function updateServicesInfo(data: UpdateServicesInfoRequest) {
    return api.patch('/services-info', data);
}

export async function updateContactMethod(data: ContactMethodRequest) {
    return api.patch('/contact-method', data);
}

export async function deleteMediaFile(fileName: string) {
    return api.delete(`/file/${fileName}`);
}

export async function deleteContactMethod(contactMethodType: string) {
    return api.delete(`/contact-method/${contactMethodType}`);
}

export async function updateLocation(data: UpdateLocationRequest) {
    return api.patch('/location', data);
}