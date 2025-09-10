import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

type MassageType = {
    code: string;
    label: string;
};

type OptionType = {
    value: string;
    label: string;
};

// Form step store
export const stepStore = writable(1);

// Options for select fields
export const contactTypes = [
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'TELEGRAM', label: 'Telegram' },
    { value: 'SMS', label: 'SMS' },
    { value: 'OTHER', label: 'Other' }
];

export const escortServices = writable<OptionType[]>([]);
export const escortFantasies = writable<OptionType[]>([]);

export const massageTypes = writable<OptionType[]>([]);
export const hairColorOptions = writable<OptionType[]>([]);
export const eyeColorOptions = writable<OptionType[]>([]);
export const skinColorOptions = writable<OptionType[]>([]);
export const ethnicityOptions = writable<OptionType[]>([]);
export const breastSizeOptions = writable<OptionType[]>([]);
export const buttSizeOptions = writable<OptionType[]>([]);
export const virtualServiceOptions = writable<OptionType[]>([]);
export const waxingLevelOptions = writable<OptionType[]>([]);
export const penisSizeOptions = writable<OptionType[]>([]);

// Load all types from API
if (browser) {
    loadMassageTypes();
    loadHairColors();
    loadEyeColors();
    loadSkinTones();
    loadEthnicities();
    loadBreastSizes();
    loadButtSizes();
    loadVirtualServiceTypes();
    loadWaxingLevels();
    loadPenisSizes();
    loadEscortServices();
    loadEscortFantasies();
}

async function loadMassageTypes() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/massage`);
        if (response.ok) {
            const massageTypesData: MassageType[] = await response.json();
            const formattedTypes = massageTypesData.map(type => ({
                value: type.code,
                label: type.label
            }));
            massageTypes.set(formattedTypes);
        } else {
            console.error('Failed to load massage types:', response.statusText);
            // Fallback to hardcoded values
            massageTypes.set([
                { value: 'EROTIC', label: 'Erotic' },
                { value: 'SENSUAL', label: 'Sensual' },
                { value: 'OTHER', label: 'Other' }
            ]);
        }
    } catch (error) {
        console.error('Error loading massage types:', error);
        // Fallback to hardcoded values
        massageTypes.set([
            { value: 'EROTIC', label: 'Erotic' },
            { value: 'SENSUAL', label: 'Sensual' },
            { value: 'OTHER', label: 'Other' }
        ]);
    }
}

async function loadHairColors() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/hair-colors`);
        if (response.ok) {
            const hairColorsData: MassageType[] = await response.json();
            const formattedTypes = hairColorsData.map(type => ({
                value: type.code,
                label: type.label
            }));
            hairColorOptions.set(formattedTypes);
        } else {
            console.error('Failed to load hair colors:', response.statusText);
            // Fallback to hardcoded values
            hairColorOptions.set([
                {value:'BLACK',label:'Black'},
                {value:'DARK_BROWN',label:'Dark Brown'},
                {value:'MEDIUM_BROWN',label:'Medium Brown'},
                {value:'BLONDE',label:'Blonde'},
                {value:'RED',label:'Red'},
                {value:'OTHER',label:'Other'}
            ]);
        }
    } catch (error) {
        console.error('Error loading hair colors:', error);
        // Fallback to hardcoded values
        hairColorOptions.set([
            {value:'BLACK',label:'Black'},
            {value:'DARK_BROWN',label:'Dark Brown'},
            {value:'MEDIUM_BROWN',label:'Medium Brown'},
            {value:'BLONDE',label:'Blonde'},
            {value:'RED',label:'Red'},
            {value:'OTHER',label:'Other'}
        ]);
    }
}

async function loadEyeColors() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/eye-colors`);
        if (response.ok) {
            const eyeColorsData: MassageType[] = await response.json();
            const formattedTypes = eyeColorsData.map(type => ({
                value: type.code,
                label: type.label
            }));
            eyeColorOptions.set(formattedTypes);
        } else {
            console.error('Failed to load eye colors:', response.statusText);
            // Fallback to hardcoded values
            eyeColorOptions.set([
                {value:'BROWN',label:'Brown'},
                {value:'GREEN',label:'Green'},
                {value:'BLUE',label:'Blue'},
                {value:'HAZEL',label:'Hazel'},
                {value:'OTHER',label:'Other'}
            ]);
        }
    } catch (error) {
        console.error('Error loading eye colors:', error);
        // Fallback to hardcoded values
        eyeColorOptions.set([
            {value:'BROWN',label:'Brown'},
            {value:'GREEN',label:'Green'},
            {value:'BLUE',label:'Blue'},
            {value:'HAZEL',label:'Hazel'},
            {value:'OTHER',label:'Other'}
        ]);
    }
}

async function loadSkinTones() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/skin-tones`);
        if (response.ok) {
            const skinTonesData: MassageType[] = await response.json();
            const formattedTypes = skinTonesData.map(type => ({
                value: type.code,
                label: type.label
            }));
            skinColorOptions.set(formattedTypes);
        } else {
            console.error('Failed to load skin tones:', response.statusText);
            // Fallback to hardcoded values
            skinColorOptions.set([
                {value:'VERY_FAIR',label:'Very Fair'},
                {value:'FAIR',label:'Fair'},
                {value:'LIGHT',label:'Light'},
                {value:'MEDIUM',label:'Medium'},
                {value:'TAN',label:'Tan'},
                {value:'BROWN',label:'Brown'},
                {value:'OTHER',label:'Other'}
            ]);
        }
    } catch (error) {
        console.error('Error loading skin tones:', error);
        // Fallback to hardcoded values
        skinColorOptions.set([
            {value:'VERY_FAIR',label:'Very Fair'},
            {value:'FAIR',label:'Fair'},
            {value:'LIGHT',label:'Light'},
            {value:'MEDIUM',label:'Medium'},
            {value:'TAN',label:'Tan'},
            {value:'BROWN',label:'Brown'},
            {value:'OTHER',label:'Other'}
        ]);
    }
}

async function loadEthnicities() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/ethnicities`);
        if (response.ok) {
            const ethnicitiesData: MassageType[] = await response.json();
            const formattedTypes = ethnicitiesData.map(type => ({
                value: type.code,
                label: type.label
            }));
            ethnicityOptions.set(formattedTypes);
        } else {
            console.error('Failed to load ethnicities:', response.statusText);
            // Fallback to hardcoded values
            ethnicityOptions.set([
                {value:'LATINO_HISPANIC',label:'Latino/Hispanic'},
                {value:'WHITE_CAUCASIAN',label:'White/Caucasian'},
                {value:'AFRICAN_AMERICAN',label:'African American'},
                {value:'EAST_ASIAN',label:'East Asian'},
                {value:'OTHER',label:'Other'}
            ]);
        }
    } catch (error) {
        console.error('Error loading ethnicities:', error);
        // Fallback to hardcoded values
        ethnicityOptions.set([
            {value:'LATINO_HISPANIC',label:'Latino/Hispanic'},
            {value:'WHITE_CAUCASIAN',label:'White/Caucasian'},
            {value:'AFRICAN_AMERICAN',label:'African American'},
            {value:'EAST_ASIAN',label:'East Asian'},
            {value:'OTHER',label:'Other'}
        ]);
    }
}

async function loadBreastSizes() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/breast-sizes`);
        if (response.ok) {
            const breastSizesData: MassageType[] = await response.json();
            const formattedTypes = breastSizesData.map(type => ({
                value: type.code,
                label: type.label
            }));
            breastSizeOptions.set(formattedTypes);
        } else {
            console.error('Failed to load breast sizes:', response.statusText);
            // Fallback to hardcoded values
            breastSizeOptions.set([
                {value:'FLAT',label:'Flat'},
                {value:'SMALL',label:'Small'},
                {value:'MEDIUM',label:'Medium'},
                {value:'BIG',label:'Big'},
                {value:'UNDISCLOSED',label:'Undisclosed'}
            ]);
        }
    } catch (error) {
        console.error('Error loading breast sizes:', error);
        // Fallback to hardcoded values
        breastSizeOptions.set([
            {value:'FLAT',label:'Flat'},
            {value:'SMALL',label:'Small'},
            {value:'MEDIUM',label:'Medium'},
            {value:'BIG',label:'Big'},
            {value:'UNDISCLOSED',label:'Undisclosed'}
        ]);
    }
}

async function loadButtSizes() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/butt-sizes`);
        if (response.ok) {
            const buttSizesData: MassageType[] = await response.json();
            const formattedTypes = buttSizesData.map(type => ({
                value: type.code,
                label: type.label
            }));
            buttSizeOptions.set(formattedTypes);
        } else {
            console.error('Failed to load butt sizes:', response.statusText);
            // Fallback to hardcoded values
            buttSizeOptions.set([
                {value:'FLAT',label:'Flat'},
                {value:'SMALL',label:'Small'},
                {value:'AVERAGE',label:'Average'},
                {value:'BIG',label:'Big'},
                {value:'THICC',label:'Thicc'},
                {value:'UNDISCLOSED',label:'Undisclosed'}
            ]);
        }
    } catch (error) {
        console.error('Error loading butt sizes:', error);
        // Fallback to hardcoded values
        buttSizeOptions.set([
            {value:'FLAT',label:'Flat'},
            {value:'SMALL',label:'Small'},
            {value:'AVERAGE',label:'Average'},
            {value:'BIG',label:'Big'},
            {value:'THICC',label:'Thicc'},
            {value:'UNDISCLOSED',label:'Undisclosed'}
        ]);
    }
}

async function loadVirtualServiceTypes() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/virtual-service-types`);
        if (response.ok) {
            const virtualServiceTypesData: MassageType[] = await response.json();
            const formattedTypes = virtualServiceTypesData.map(type => ({
                value: type.code,
                label: type.label
            }));
            virtualServiceOptions.set(formattedTypes);
        } else {
            console.error('Failed to load virtual service types:', response.statusText);
            // Fallback to hardcoded values
            virtualServiceOptions.set([
                { value: 'VIDEO_CALL', label: 'Video Call' },
                { value: 'DIRTY_TALK', label: 'Dirty Talk' },
                { value: 'OTHER', label: 'Other' }
            ]);
        }
    } catch (error) {
        console.error('Error loading virtual service types:', error);
        // Fallback to hardcoded values
        virtualServiceOptions.set([
            { value: 'VIDEO_CALL', label: 'Video Call' },
            { value: 'DIRTY_TALK', label: 'Dirty Talk' },
            { value: 'OTHER', label: 'Other' }
        ]);
    }
}

async function loadWaxingLevels() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/waxing-levels`);
        if (response.ok) {
            const waxingLevelsData: MassageType[] = await response.json();
            const formattedTypes = waxingLevelsData.map(type => ({
                value: type.code,
                label: type.label
            }));
            waxingLevelOptions.set(formattedTypes);
        } else {
            console.error('Failed to load waxing levels:', response.statusText);
            // Fallback to hardcoded values
            waxingLevelOptions.set([
                {value:'NATURAL',label:'Natural'},
                {value:'TRIMMED',label:'Trimmed'},
                {value:'FULLY_WAXED',label:'Fully Waxed'},
                {value:'UNDISCLOSED',label:'Undisclosed'}
            ]);
        }
    } catch (error) {
        console.error('Error loading waxing levels:', error);
        // Fallback to hardcoded values
        waxingLevelOptions.set([
            {value:'NATURAL',label:'Natural'},
            {value:'TRIMMED',label:'Trimmed'},
            {value:'FULLY_WAXED',label:'Fully Waxed'},
            {value:'UNDISCLOSED',label:'Undisclosed'}
        ]);
    }
}

async function loadPenisSizes() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/penis-sizes`);
        if (response.ok) {
            const penisSizesData: MassageType[] = await response.json();
            const formattedTypes = penisSizesData.map(type => ({
                value: type.code,
                label: type.label
            }));
            penisSizeOptions.set(formattedTypes);
        } else {
            console.error('Failed to load penis sizes:', response.statusText);
            // Fallback to hardcoded values
            penisSizeOptions.set([
                {value:'NON_EXISTENT',label:'Non-existent'},
                {value:'BELOW_AVERAGE',label:'Below Average'},
                {value:'AVERAGE',label:'Average'},
                {value:'ABOVE_AVERAGE',label:'Above Average'},
                {value:'BIG',label:'Big'},
                {value:'HUGE',label:'Huge'},
                {value:'UNDISCLOSED',label:'Undisclosed'}
            ]);
        }
    } catch (error) {
        console.error('Error loading penis sizes:', error);
        // Fallback to hardcoded values
        penisSizeOptions.set([
            {value:'NON_EXISTENT',label:'Non-existent'},
            {value:'BELOW_AVERAGE',label:'Below Average'},
            {value:'AVERAGE',label:'Average'},
            {value:'ABOVE_AVERAGE',label:'Above Average'},
            {value:'BIG',label:'Big'},
            {value:'HUGE',label:'Huge'},
            {value:'UNDISCLOSED',label:'Undisclosed'}
        ]);
    }
}

async function loadEscortServices() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/services?lang=es_ar&activeOnly=true`);
        if (response.ok) {
            const servicesData: MassageType[] = await response.json();
            const formattedTypes = servicesData.map(type => ({
                value: type.code,
                label: type.label
            }));
            escortServices.set(formattedTypes);
        } else {
            console.error('Failed to load escort services:', response.statusText);
            // Fallback to hardcoded values
            escortServices.set([
                { value: 'POSITION_69', label: '69 Position' },
                { value: 'CLASSIC_VAGINAL_SEX', label: 'Classic Vaginal Sex' },
                { value: 'OTHER', label: 'Other' }
            ]);
        }
    } catch (error) {
        console.error('Error loading escort services:', error);
        // Fallback to hardcoded values
        escortServices.set([
            { value: 'POSITION_69', label: '69 Position' },
            { value: 'CLASSIC_VAGINAL_SEX', label: 'Classic Vaginal Sex' },
            { value: 'OTHER', label: 'Other' }
        ]);
    }
}

async function loadEscortFantasies() {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/escort/types/fantasy-types?lang=es_ar&activeOnly=true`);
        if (response.ok) {
            const fantasiesData: MassageType[] = await response.json();
            const formattedTypes = fantasiesData.map(type => ({
                value: type.code,
                label: type.label
            }));
            escortFantasies.set(formattedTypes);
        } else {
            console.error('Failed to load escort fantasies:', response.statusText);
            // Fallback to hardcoded values
            escortFantasies.set([
                { value: 'SEX_TOYS', label: 'Sex Devices / Toys' },
                { value: 'ROLEPLAY', label: 'Roleplay' },
                { value: 'OTHER', label: 'Other' }
            ]);
        }
    } catch (error) {
        console.error('Error loading escort fantasies:', error);
        // Fallback to hardcoded values
        escortFantasies.set([
            { value: 'SEX_TOYS', label: 'Sex Devices / Toys' },
            { value: 'ROLEPLAY', label: 'Roleplay' },
            { value: 'OTHER', label: 'Other' }
        ]);
    }
}

// Keep static virtualServices for backward compatibility
export const virtualServices = [
    { value: 'VIDEO_CALL', label: 'Video Call' },
    { value: 'DIRTY_TALK', label: 'Dirty Talk' },
    { value: 'OTHER', label: 'Other' }
];

export const genderOptions = [
    { value: 'MALE', label: 'Hombre / Male' },
    { value: 'FEMALE', label: 'Mujer / Female' },
    { value: 'NON_BINARY', label: 'No binarie / Non-binary' },
    { value: 'TRANSGENDER_MALE', label: 'Hombre trans / Transgender Male' },
    { value: 'TRANSGENDER_FEMALE', label: 'Mujer trans / Transgender Female' },
    { value: 'GENDER_FLUID', label: 'Género fluido / Gender Fluid' },
    { value: 'OTHER', label: 'Otro / Otra / Otre / Other' },
    { value: 'UNDISCLOSED', label: 'No especificado / Undisclosed' }
];

// Keep static options as fallback - these are now defined as writable stores above

export const countriesList = [{ value: 'AR', label: 'Argentina' }];

export const daysMap = { 
    LUN:'MONDAY', 
    MAR:'TUESDAY', 
    MIE:'WEDNESDAY', 
    JUE:'THURSDAY', 
    VIE:'FRIDAY', 
    SAB:'SATURDAY', 
    DOM:'SUNDAY' 
};