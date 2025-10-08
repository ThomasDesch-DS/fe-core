<script lang="ts">
    import { onMount } from 'svelte';
    import { stepStore } from './store/formStore';
    import type { DaySlots, FormData } from './types';
    
    import FormLayout from './components/FormLayout.svelte';
    import MediaModal from './components/MediaModal.svelte';
    
    // Form step components
    import PersonalInfo from './components/steps/PersonalInfo.svelte';
    import PhysicalAttributes from './components/steps/PhysicalAttributes.svelte';
    import ServicesInfo from './components/steps/ServicesInfo.svelte';
    import Availability from './components/steps/Availability.svelte';
    import Description from './components/steps/Description.svelte';
    import Location from './components/steps/Location.svelte';
    import MediaUpload from './components/steps/MediaUpload.svelte';
    import SubmitStep from './components/steps/SubmitStep.svelte';

    // Initialize form data
    const formData: FormData = {
        // Personal info
        name: '',
        surname: '',
        displayName: '',
        email: '',
        code: '',
        age: '',
        gender: '',
        privatePhoneNumber: '',
        publicPhoneNumber: '',
        idNumber: '',
        password: '',
        confirmPassword: '',
        documentation: '',
        
        // Physical attributes
        heightInCm: '',
        weightInKg: '',
        nationality: '',
        hairColor: '',
        eyeColor: '',
        skinColor: '',
        ethnicity: '',
        bust: '',
        waist: '',
        hips: '',
        breastSize: '',
        buttSize: '',
        waxingLevel: '',
        penisSize: '',
        
        // Services
        selectedServices: new Set<string>(),
        selectedFantasies: new Set<string>(),
        selectedMassages: new Set<string>(),
        selectedVirtual: new Set<string>(),
        
        // Pricing
        hourPriceAmount: '',
        hourPriceCurrency: 'USD',
        customRates: [],
        
        // Description
        description: '',
        
        // Contact and availability
        contactMethods: [],
        onlyVirtual: false,
        onlyInPerson: false,
        ownApartment: false,
        motels: false,
        clientPlace: false,
        scheduleText: '',
        daySlots: {
            MONDAY: [{start: '', end: ''}],
            TUESDAY: [{start: '', end: ''}],
            WEDNESDAY: [{start: '', end: ''}],
            THURSDAY: [{start: '', end: ''}],
            FRIDAY: [{start: '', end: ''}],
            SATURDAY: [{start: '', end: ''}],
            SUNDAY: [{start: '', end: ''}]
        },
        
        // Location
        country: '',
        state: '',
        city: '',
        hood: '',
        
        // Media
        profilePicBase64: '',
        pics: [],
        videos: [],
        audioClipBase64: '',
        mediaId: 0,
        kycIdPhoto: '',
        kycIdFront: '',
        kycIdBack: '',

        // Referral
        referredByCode: ''
    };
    
    // For tracking current step
    let step = 1;
    
    // Subscribe to step store
    const unsubscribe = stepStore.subscribe(value => {
        step = value;
    });
    
    // Clean up subscription on component destroy
    onMount(() => {
        return () => {
            if (unsubscribe) unsubscribe();
        };
    });
</script>

<FormLayout>
    <!-- Personal Info Steps (1-11.5) -->
    <PersonalInfo {formData} />
    
    <!-- Physical Attributes Steps (12-25) -->
    <PhysicalAttributes {formData} />
    
    <!-- Services Steps (26-32) -->
    <ServicesInfo {formData} />
    
    <!-- Availability Steps (33-34) -->
    <Availability {formData} />
    
    <!-- Description Steps (35-36) -->
    <Description {formData} />
    
    <!-- Location Step (37) -->
    <Location {formData} />
    
    <!-- Media Upload Step (38) -->
    <MediaUpload {formData} />
    
    <!-- Submit Step (39) -->
    <SubmitStep {formData} />
</FormLayout>