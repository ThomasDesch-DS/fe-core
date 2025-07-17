import { writable } from 'svelte/store';

// Form step store
export const stepStore = writable(1);

// Options for select fields
export const contactTypes = [
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'TELEGRAM', label: 'Telegram' },
    { value: 'SMS', label: 'SMS' },
    { value: 'OTHER', label: 'Other' }
];

export const escortServices = [
    { value: 'POSITION_69', label: '69 Position' },
    { value: 'CLASSIC_VAGINAL_SEX', label: 'Classic Vaginal Sex' },
    { value: 'OTHER', label: 'Other' }
];

export const escortFantasies = [
    { value: 'SEX_TOYS', label: 'Sex Devices / Toys' },
    { value: 'ROLEPLAY', label: 'Roleplay' },
    { value: 'OTHER', label: 'Other' }
];

export const massageTypes = [
    { value: 'EROTIC', label: 'Erotic' },
    { value: 'SENSUAL', label: 'Sensual' },
    { value: 'OTHER', label: 'Other' }
];

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

export const hairColorOptions = [
    {value:'BLACK',label:'Black'},
    {value:'DARK_BROWN',label:'Dark Brown'},
    {value:'MEDIUM_BROWN',label:'Medium Brown'},
    {value:'BLONDE',label:'Blonde'},
    {value:'RED',label:'Red'},
    {value:'OTHER',label:'Other'}
];

export const eyeColorOptions = [
    {value:'BROWN',label:'Brown'},
    {value:'GREEN',label:'Green'},
    {value:'BLUE',label:'Blue'},
    {value:'HAZEL',label:'Hazel'},
    {value:'OTHER',label:'Other'}
];

export const skinColorOptions = [
    {value:'VERY_FAIR',label:'Very Fair'},
    {value:'FAIR',label:'Fair'},
    {value:'LIGHT',label:'Light'},
    {value:'MEDIUM',label:'Medium'},
    {value:'TAN',label:'Tan'},
    {value:'BROWN',label:'Brown'},
    {value:'OTHER',label:'Other'}
];

export const ethnicityOptions = [
    {value:'LATINO_HISPANIC',label:'Latino/Hispanic'},
    {value:'WHITE_CAUCASIAN',label:'White/Caucasian'},
    {value:'AFRICAN_AMERICAN',label:'African American'},
    {value:'EAST_ASIAN',label:'East Asian'},
    {value:'OTHER',label:'Other'}
];

export const breastSizeOptions = [
    {value:'FLAT',label:'Flat'},
    {value:'SMALL',label:'Small'},
    {value:'MEDIUM',label:'Medium'},
    {value:'BIG',label:'Big'},
    {value:'UNDISCLOSED',label:'Undisclosed'}
];

export const buttSizeOptions = [
    {value:'FLAT',label:'Flat'},
    {value:'SMALL',label:'Small'},
    {value:'AVERAGE',label:'Average'},
    {value:'BIG',label:'Big'},
    {value:'THICC',label:'Thicc'},
    {value:'UNDISCLOSED',label:'Undisclosed'}
];

export const waxingLevelOptions = [
    {value:'NATURAL',label:'Natural'},
    {value:'TRIMMED',label:'Trimmed'},
    {value:'FULLY_WAXED',label:'Fully Waxed'},
    {value:'UNDISCLOSED',label:'Undisclosed'}
];

export const penisSizeOptions = [
    {value:'NON_EXISTENT',label:'Non-existent'},
    {value:'BELOW_AVERAGE',label:'Below Average'},
    {value:'AVERAGE',label:'Average'},
    {value:'ABOVE_AVERAGE',label:'Above Average'},
    {value:'BIG',label:'Big'},
    {value:'HUGE',label:'Huge'},
    {value:'UNDISCLOSED',label:'Undisclosed'}
];

export const countriesList = [{ value: 'ARGENTINA', label: 'Argentina' }];

export const daysMap = { 
    LUN:'MONDAY', 
    MAR:'TUESDAY', 
    MIE:'WEDNESDAY', 
    JUE:'THURSDAY', 
    VIE:'FRIDAY', 
    SAB:'SATURDAY', 
    DOM:'SUNDAY' 
};