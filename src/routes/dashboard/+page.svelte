<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    import { authStore } from '$lib/escort/store/authStore';
    import { logout } from '$lib/escort/api/authApi';
    import { updateInfo, updateAppearance, updateAvailability, updateMedia, updateServicesInfo, updateContactMethod, deleteMediaFile, deleteContactMethod, updateLocation, type UpdateInfoRequest, type UpdateAppearanceRequest, type UpdateServicesInfoRequest, type ContactMethodRequest, type UpdateLocationRequest } from '$lib/escort/api/profileApi';
    import { goto } from '$app/navigation';
    import { onDestroy } from 'svelte';
    import {formatPrice} from "../../util/PriceUtils";

    let activeTab = 'Perfil';
    const tabs = ['Perfil', 'Media', 'Servicios', 'Disponibilidad', 'Ubicación'];

    let authState;
    const unsubscribe = authStore.subscribe(state => {
        authState = state;
    });
    onDestroy(unsubscribe);

    $: escort = authState.user?.profile || null;

    // Edit mode state
    let editMode = {
        description: false,
        appearance: false,
        contact: false,
        services: false,
        availability: false,
        location: false
    };

    // Temporary edit values
    let editValues = {};
    let isSaving = false;
    let saveMessage = '';

    // Service options
    const serviceOptions = {
        escortServices: [
            { value: 'POSITION_69', label: '69 Position' },
            { value: 'CLASSIC_VAGINAL_SEX', label: 'Classic Vaginal Sex' },
            { value: 'CUM_ON_BODY', label: 'Cum on Body' },
            { value: 'CUNNILINGUS', label: 'Cunnilingus' },
            { value: 'DEEPTHROAT', label: 'Deepthroat' },
            { value: 'DIRTY_TALK', label: 'Dirty Talk' },
            { value: 'EROTIC_MASSAGE', label: 'Erotic Massage' },
            { value: 'EXTRABALL', label: 'Extraball' },
            { value: 'FACESITTING', label: 'Facesitting' },
            { value: 'FINDOM', label: 'Findom' },
            { value: 'FOOT_FETISH', label: 'Foot Fetish' },
            { value: 'FRENCH_KISSING', label: 'French Kissing' },
            { value: 'GFE', label: 'GFE' },
            { value: 'HANDJOB', label: 'Handjob' },
            { value: 'KAMASUTRA', label: 'Kamasutra' },
            { value: 'MASTURBATION', label: 'Masturbation' },
            { value: 'ORAL_WITHOUT_CONDOM', label: 'Oral Without Condom' },
            { value: 'PORN_STAR_EXPERIENCE', label: 'Porn Star Experience' },
            { value: 'RIMMING_PASSIVE', label: 'Rimming Passive' },
            { value: 'RIMMING_ACTIVE', label: 'Rimming Active' },
            { value: 'ROLE_PLAY', label: 'Role-play' },
            { value: 'SEX_BETWEEN_BREASTS', label: 'Sex Between Breasts' },
            { value: 'SEX_TOYS', label: 'Sex Toys' },
            { value: 'STRAP_ON_SERVICE', label: 'Strapon Service' },
            { value: 'STRIPTEASE', label: 'Striptease' },
            { value: 'UNIFORMS', label: 'Uniforms' },
            { value: 'BDSM_FEMDOM', label: 'BDSM - Femdom' },
            { value: 'CASUAL_PHOTOS', label: 'Casual Photos' },
            { value: 'DURING_MEETING', label: 'During the Meeting' },
            { value: 'COUPLES', label: 'Couples' },
            { value: 'CUM_IN_FACE', label: 'Cum in Face' },
            { value: 'CUM_IN_MOUTH', label: 'Cum in Mouth' },
            { value: 'DOMINATION', label: 'Domination' },
            { value: 'DUO_WITH_GIRL', label: 'Duo with Girl' },
            { value: 'EROTIC_PHOTOS', label: 'Erotic Photos' },
            { value: 'FINGERING', label: 'Fingering' },
            { value: 'GOLDEN_SHOWER_GIVE', label: 'Golden Shower (Give)' },
            { value: 'GOLDEN_SHOWER_RECEIVE', label: 'Golden Shower (Receive)' },
            { value: 'GROUP_SEX', label: 'Group Sex' },
            { value: 'PROSTATE_MASSAGE', label: 'Prostate Massage' },
            { value: 'SHOWER_TOGETHER', label: 'Shower Together' },
            { value: 'SQUIRTING', label: 'Squirting' },
            { value: 'SUBMISSIVE', label: 'Submissive' },
            { value: 'SWALLOWING', label: 'Swallowing' },
            { value: 'VIDEO_WITH_SEX', label: 'Video with Sex' },
            { value: 'ANAL', label: 'Anal' },
            { value: 'BONDAGE', label: 'Bondage' },
            { value: 'WITH_TWO_MEN', label: 'With 2 Men' },
            { value: 'CUSTOM', label: 'Custom' },
            { value: 'OTHER', label: 'Other' }
        ],
        escortFantasies: [
            { value: 'SEX_TOYS', label: 'Sex Devices / Toys' },
            { value: 'EROTIC_DISCIPLINE', label: 'Erotic Discipline' },
            { value: 'COSTUMES', label: 'Costumes' },
            { value: 'SPECIAL_LINGERIE', label: 'Special Lingerie' },
            { value: 'ROLEPLAY', label: 'Roleplay' },
            { value: 'FOOT_FETISH', label: 'Foot Fetish' },
            { value: 'CHOKING', label: 'Choking' },
            { value: 'DOMINATION', label: 'Domination' },
            { value: 'FEMDOM', label: 'Femdom' },
            { value: 'FETISHISM', label: 'Fetishism' },
            { value: 'HUMILIATION_GIVE', label: 'Humiliation (Give)' },
            { value: 'HUMILIATION_RECEIVE', label: 'Humiliation (Receive)' },
            { value: 'SUBMISSIVE', label: 'Submissive' },
            { value: 'BDSM', label: 'BDSM' },
            { value: 'FETISH', label: 'Fetish' },
            { value: 'SHOWER', label: 'Shower Together' },
            { value: 'DISCIPLINE', label: 'Discipline' },
            { value: 'LOVE', label: 'Love' },
            { value: 'DOMINATE', label: 'Dominate' },
            { value: 'DOMINATRIX', label: 'Dominatrix' },
            { value: 'SADO', label: 'Sado' },
            { value: 'SADOMASOCHISM', label: 'Sadomasochism' },
            { value: 'SODOMISATION', label: 'Sodomisation' },
            { value: 'SUBMISSION', label: 'Submission' },
            { value: 'TRANSFORMISM', label: 'Transformism' },
            { value: 'GOLDEN_SHOWER_GIVE', label: 'Golden Shower (Give)' },
            { value: 'GOLDEN_SHOWER_RECEIVE', label: 'Golden Shower (Receive)' },
            { value: 'GOLDEN_SHOWER_SWALLOW', label: 'Golden Shower (Swallow)' },
            { value: 'PAIN_GIVE', label: 'Pain (Give)' },
            { value: 'PAIN_RECEIVE', label: 'Pain (Receive)' }
        ],
        massageType: [
            { value: 'EROTIC', label: 'Erotic' },
            { value: 'SENSUAL', label: 'Sensual' },
            { value: 'PROSTATE', label: 'Prostate' },
            { value: 'NURU', label: 'Nuru' },
            { value: 'BODY_TO_BODY', label: 'Body to Body' },
            { value: 'TANTRA', label: 'Tantra' },
            { value: 'THAI', label: 'Thai' },
            { value: 'RELAXING', label: 'Relaxing' },
            { value: 'DEEP_TISSUE', label: 'Deep Tissue' },
            { value: 'SWEDISH', label: 'Swedish' },
            { value: 'OIL', label: 'Oil Massage' },
            { value: 'FOUR_HANDS', label: 'Four Hands' },
            { value: 'FOOT_MASSAGE', label: 'Foot Massage' },
            { value: 'LINGAM', label: 'Lingam' },
            { value: 'YONI', label: 'Yoni' },
            { value: 'SPORTS', label: 'Sports Massage' },
            { value: 'CUSTOM', label: 'Custom' },
            { value: 'OTHER', label: 'Other' }
        ],
        virtualServices: [
            { value: 'VIDEO_CALL', label: 'Video Call' },
            { value: 'AUDIO_CALL', label: 'Audio Call' },
            { value: 'CAM_SHOW', label: 'Cam Show' },
            { value: 'JOI', label: 'JOI (Jerk Off Instruction)' },
            { value: 'CEI', label: 'CEI (Cum Eating Instruction)' },
            { value: 'DIRTY_TALK', label: 'Dirty Talk' },
            { value: 'SEXTING', label: 'Sexting' },
            { value: 'CUSTOM_VIDEO', label: 'Custom Video' },
            { value: 'CUSTOM_PHOTOS', label: 'Custom Photos' },
            { value: 'TEXT_CHAT', label: 'Text Chat' },
            { value: 'ROLEPLAY_CHAT', label: 'Roleplay Chat' },
            { value: 'VIRTUAL_DOMINATION', label: 'Virtual Domination' },
            { value: 'FINANCIAL_DOMINATION', label: 'Financial Domination' },
            { value: 'STRIPTEASE', label: 'Virtual Striptease' },
            { value: 'LIVE_MASTURBATION', label: 'Live Masturbation' },
            { value: 'ASMR', label: 'Erotic ASMR' },
            { value: 'OTHER', label: 'Other' }
        ]
    };

    const currencies = [
        { value: 'ARS', label: 'ARS' },
        { value: 'USD', label: 'USD' },
        { value: 'CRYPTO', label: 'CRYPTO' }
    ];

    // Initialize edit values when escort data loads
    $: if (escort && Object.keys(editValues).length === 0) {
        editValues = {
            displayName: escort.displayName,
            description: escort.description,
            publicPhoneNumber: escort.publicPhoneNumber,
            heightInCm: escort.appearance.heightInCm,
            weightInKg: escort.appearance.weightInKg,
            bust: escort.appearance.bust,
            waist: escort.appearance.waist,
            hips: escort.appearance.hips,
            hourPrice: escort.servicesInfo.hourPrice.amount,
            currency: escort.servicesInfo.hourPrice.currency,
            escortServices: [...(escort.servicesInfo.escortServices || [])],
            escortFantasies: [...(escort.servicesInfo.escortFantasies || [])],
            massageType: [...(escort.servicesInfo.massageType || [])],
            virtualServices: [...(escort.servicesInfo.virtualServices || [])],
            customRate: [...(escort.servicesInfo.customRate || [])],
            contactMethod: escort.contactMethod.map(c => ({ ...c })),
            country: escort.location.country,
            state: escort.location.state,
            city: escort.location.city,
            hood: escort.location.hood
        };
    }

    let isLoggingOut = false;
    const handleLogout = async () => {
        isLoggingOut = true;
        try {
            await logout();
            authStore.logout();
            goto('/dashboard/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            isLoggingOut = false;
        }
    };

    // Media handling functions
    let newProfilePic = '';
    let photosToAdd: { url: string, order: number }[] = [];
    let photosToRemove: { url: string, order: number }[] = [];

    async function updateMediaFiles() {
        if (!escort) return;
        
        isSaving = true;
        saveMessage = '';
        
        try {
            const mediaData = {
                profilePic: newProfilePic || undefined,
                photosToAdd: photosToAdd.length > 0 ? photosToAdd : undefined,
                photosToRemove: photosToRemove.length > 0 ? photosToRemove : undefined,
                videosToAdd: undefined,
                videosToRemove: undefined,
                audioToAdd: undefined,
                audioToRemove: undefined
            };

            const result = await updateMedia(mediaData);
            
            // The API returns the new file names, update the store accordingly
            if (result.files) {
                saveMessage = `Media updated successfully. New files: ${result.files.join(', ')}`;
                // Reset the temporary arrays
                newProfilePic = '';
                photosToAdd = [];
                photosToRemove = [];
                
                // Refresh the profile data
                // You might want to fetch updated profile here or handle the response properly
            } else {
                saveMessage = 'Media updated successfully';
            }
            
            setTimeout(() => saveMessage = '', 3000);
            
        } catch (error) {
            console.error('Media update failed:', error);
            saveMessage = error.message || 'Failed to update media';
            setTimeout(() => saveMessage = '', 5000);
        } finally {
            isSaving = false;
        }
    }

    function addPhotoToUpload() {
        const url = prompt('Enter photo URL:');
        if (url) {
            photosToAdd = [...photosToAdd, { url, order: photosToAdd.length + 1 }];
        }
    }

    function removePhoto(photoUrl: string, order: number) {
        photosToRemove = [...photosToRemove, { url: photoUrl, order }];
    }

    async function deletePhoto(fileName: string) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) return;
        
        isSaving = true;
        try {
            await deleteMediaFile(fileName);
            saveMessage = 'Foto eliminada exitosamente';
            // Refresh profile data or remove from local state
            setTimeout(() => saveMessage = '', 3000);
        } catch (error) {
            console.error('Delete photo failed:', error);
            saveMessage = error.message || 'Error al eliminar la foto';
            setTimeout(() => saveMessage = '', 5000);
        } finally {
            isSaving = false;
        }
    }

    async function deleteVideo(fileName: string) {
        if (!confirm('¿Estás seguro de que quieres eliminar este video?')) return;
        
        isSaving = true;
        try {
            await deleteMediaFile(fileName);
            saveMessage = 'Video eliminado exitosamente';
            setTimeout(() => saveMessage = '', 3000);
        } catch (error) {
            console.error('Delete video failed:', error);
            saveMessage = error.message || 'Error al eliminar el video';
            setTimeout(() => saveMessage = '', 5000);
        } finally {
            isSaving = false;
        }
    }

    async function deleteAudio(fileName: string) {
        if (!confirm('¿Estás seguro de que quieres eliminar este audio?')) return;
        
        isSaving = true;
        try {
            await deleteMediaFile(fileName);
            saveMessage = 'Audio eliminado exitosamente';
            setTimeout(() => saveMessage = '', 3000);
        } catch (error) {
            console.error('Delete audio failed:', error);
            saveMessage = error.message || 'Error al eliminar el audio';
            setTimeout(() => saveMessage = '', 5000);
        } finally {
            isSaving = false;
        }
    }

    async function removeContactMethod(contactType: string) {
        if (!confirm('¿Estás seguro de que quieres eliminar este método de contacto?')) return;
        
        isSaving = true;
        try {
            await deleteContactMethod(contactType);
            
            // Update local state by removing the deleted contact method
            const updatedContactMethods = escort.contactMethod.filter(c => c.type !== contactType);
            const updatedEscort = {
                ...escort,
                contactMethod: updatedContactMethods
            };
            authStore.updateProfile(updatedEscort);
            
            // Also update editValues to reflect the change
            editValues.contactMethod = updatedContactMethods.map(c => ({ ...c }));
            
            saveMessage = 'Método de contacto eliminado exitosamente';
            setTimeout(() => saveMessage = '', 3000);
        } catch (error) {
            console.error('Delete contact method failed:', error);
            saveMessage = error.message || 'Error al eliminar el método de contacto';
            setTimeout(() => saveMessage = '', 5000);
        } finally {
            isSaving = false;
        }
    }

    // Availability management
    let editingAvailability = false;
    let availabilityData = {
        onlyVirtual: false,
        onlyInPerson: true,
        ownApartment: true,
        motels: false,
        clientPlace: true,
        schedule: [
            { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '16:00', isAvailable: false },
            { dayOfWeek: 'SUNDAY', startTime: '10:00', endTime: '16:00', isAvailable: false }
        ]
    };

    async function saveAvailability() {
        if (!escort) return;
        
        isSaving = true;
        saveMessage = '';
        
        try {
            await updateAvailability(availabilityData);
            editingAvailability = false;
            saveMessage = 'Availability updated successfully';
            setTimeout(() => saveMessage = '', 3000);
        } catch (error) {
            console.error('Availability update failed:', error);
            saveMessage = error.message || 'Failed to update availability';
            setTimeout(() => saveMessage = '', 5000);
        } finally {
            isSaving = false;
        }
    }

    function getMediaUrl(escortId: string, fileName: string, type: 'profile' | 'pics'): string {
        return `https://nexus.daisyssecrets.com/escorts/${escortId}/${type}/${fileName}`;
    }

    function toggleEdit(section: string) {
        editMode[section] = !editMode[section];
        if (!editMode[section]) {
            // Reset values when canceling
            if (escort) {
                editValues = {
                    displayName: escort.displayName,
                    description: escort.description,
                    publicPhoneNumber: escort.publicPhoneNumber,
                    heightInCm: escort.appearance.heightInCm,
                    weightInKg: escort.appearance.weightInKg,
                    bust: escort.appearance.bust,
                    waist: escort.appearance.waist,
                    hips: escort.appearance.hips,
                    hourPrice: escort.servicesInfo.hourPrice.amount,
                    currency: escort.servicesInfo.hourPrice.currency,
                    escortServices: [...(escort.servicesInfo.escortServices || [])],
                    escortFantasies: [...(escort.servicesInfo.escortFantasies || [])],
                    massageType: [...(escort.servicesInfo.massageType || [])],
                    virtualServices: [...(escort.servicesInfo.virtualServices || [])],
                    customRate: [...(escort.servicesInfo.customRate || [])],
                    contactMethod: escort.contactMethod.map(c => ({ ...c })),
                    country: escort.location.country,
                    state: escort.location.state,
                    city: escort.location.city,
                    hood: escort.location.hood
                };
            }
        }
    }

    function toggleService(category: string, serviceValue: string) {
        const services = editValues[category];
        if (services.includes(serviceValue)) {
            editValues[category] = services.filter(s => s !== serviceValue);
        } else {
            editValues[category] = [...services, serviceValue];
        }
    }

    async function saveChanges(section: string) {
        if (!escort) return;
        
        isSaving = true;
        saveMessage = '';
        
        try {
            let updatedEscort;
            
            switch (section) {
                case 'description':
                    if (editValues.description.length < 20) {
                        throw new Error('Description must be at least 20 characters');
                    }
                    updatedEscort = await updateInfo({
                        displayName: editValues.displayName,
                        description: editValues.description,
                        publicPhoneNumber: editValues.publicPhoneNumber
                    });
                    break;
                    
                case 'appearance':
                    if (editValues.heightInCm < 140 || editValues.heightInCm > 220) {
                        throw new Error('Height must be between 140-220 cm');
                    }
                    if (editValues.weightInKg < 30 || editValues.weightInKg > 150) {
                        throw new Error('Weight must be between 30-150 kg');
                    }
                    updatedEscort = await updateAppearance({
                        heightInCm: editValues.heightInCm,
                        weightInKg: editValues.weightInKg,
                        bust: editValues.bust,
                        waist: editValues.waist,
                        hips: editValues.hips
                    });
                    break;
                    
                case 'contact':
                    const validContacts = editValues.contactMethod.filter(c => c.value.trim() !== '');
                    if (validContacts.length === 0) {
                        throw new Error('At least one contact method is required');
                    }
                    // Update each contact method individually
                    for (const contact of validContacts) {
                        await updateContactMethod({
                            type: contact.type,
                            value: contact.value
                        });
                    }
                    // Create updated escort with new contact methods
                    updatedEscort = {
                        ...escort,
                        contactMethod: validContacts
                    };
                    break;
                    
                case 'services':
                    if (editValues.hourPrice < 10) {
                        throw new Error('Minimum rate is 10');
                    }
                    const allServices = [
                        ...editValues.escortServices,
                        ...editValues.escortFantasies,
                        ...editValues.massageType,
                        ...editValues.virtualServices
                    ];
                    if (allServices.length === 0) {
                        throw new Error('At least one service must be selected');
                    }
                    updatedEscort = await updateServicesInfo({
                        escortServices: editValues.escortServices,
                        escortFantasies: editValues.escortFantasies,
                        massageType: editValues.massageType,
                        virtualServices: editValues.virtualServices,
                        hourPrice: {
                            amount: editValues.hourPrice,
                            currency: editValues.currency
                        },
                        customRate: editValues.customRate.filter(rate => rate.serviceName && rate.duration)
                    });
                    break;
                    
                case 'location':
                    if (!editValues.country.trim() || !editValues.state.trim() || !editValues.city.trim() || !editValues.hood.trim()) {
                        throw new Error('All location fields are required');
                    }
                    updatedEscort = await updateLocation({
                        country: editValues.country,
                        state: editValues.state,
                        city: editValues.city,
                        hood: editValues.hood
                    });
                    break;
            }

            if (updatedEscort) {
                authStore.updateProfile(updatedEscort);
            }
            
            editMode[section] = false;
            saveMessage = 'Cambios guardados con éxito';
            setTimeout(() => saveMessage = '', 3000);
            
        } catch (error) {
            console.error('Save failed:', error);
            saveMessage = error.message || 'Failed to save changes';
            setTimeout(() => saveMessage = '', 5000);
        } finally {
            isSaving = false;
        }
    }
</script>

<style>
    /* Vercel-like theme */
    .tab-btn {
        @apply py-2 px-4 font-medium transition;
    }
    .tab-active {
        @apply text-white border-b-2 border-white;
    }
    .tab-inactive {
        @apply text-gray-500 hover:text-white;
    }
    .card {
        @apply bg-neutral-900 p-4 rounded-lg;
    }
    .badge {
        @apply text-xs font-semibold px-2 py-1 rounded bg-neutral-800 text-white;
    }
    .avatar {
        @apply w-16 h-16 rounded-full object-cover;
    }
    .edit-btn {
        @apply opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-2 right-2 bg-neutral-700 hover:bg-neutral-600 text-white p-1.5 rounded text-sm;
    }
    .input-field {
        @apply bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded focus:border-white focus:outline-none;
    }
    .save-btn {
        @apply bg-white text-black hover:bg-gray-200 px-3 py-1.5 rounded text-sm mr-2;
    }
    .cancel-btn {
        @apply bg-neutral-700 text-white hover:bg-neutral-600 px-3 py-1.5 rounded text-sm;
    }
    .save-message {
        @apply fixed top-4 right-4 px-4 py-2 rounded text-sm z-50;
    }
    .save-success {
        @apply bg-green-600 text-white;
    }
    .save-error {
        @apply bg-red-600 text-white;
    }
    .service-checkbox {
        @apply appearance-none w-4 h-4 border border-neutral-600 rounded-sm bg-neutral-800 checked:bg-white checked:border-white relative;
    }
    .service-checkbox:checked::after {
        content: '✓';
        @apply absolute text-black text-xs font-bold;
        top: -1px;
        left: 1px;
    }
    .service-label {
        @apply text-sm text-gray-300 hover:text-white cursor-pointer select-none;
    }
    .service-category {
        @apply mb-4 p-3 bg-neutral-800 rounded-lg;
    }
    .service-grid {
        @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2;
    }
</style>

{#if authState.isLoading}
    <div class="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Cargando perfil...</p>
    </div>
{:else if !authState.isAuthenticated}
    <script>goto('/dashboard/login');</script>
{:else}
    <div class="min-h-screen bg-black text-white p-6 font-sans">
        <header class="flex justify-between items-center mb-8">
            <div class="flex items-center">
                <img
                        src={getMediaUrl(escort.id, escort.media.profilePicture, 'profile')}
                        alt="Avatar"
                        class="w-24 h-24 rounded-full mr-4"
                />


                <div>
                    <h1 class="text-3xl font-bold">¡Hola, {escort.displayName}!</h1>
                    <p class="text-gray-500 mt-1">Gestiona tu perfil y servicios con facilidad.</p>
                </div>
            </div>
            <button
                    on:click={handleLogout}
                    class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    disabled={isLoggingOut}
            >
                {#if isLoggingOut}Salir...{:else}Cerrar Sesión{/if}
            </button>
        </header>

        <nav class="flex space-x-6 border-b border-gray-700 mb-8">
            {#each tabs as tab}
                <button
                        on:click={() => (activeTab = tab)}
                        class="tab-btn"
                        class:tab-active={activeTab === tab}
                        class:tab-inactive={activeTab !== tab}
                        transition:scale={{ duration: 100 }}
                >
                    {tab}
                </button>
            {/each}
        </nav>

        {#if activeTab === 'Perfil'}
            <section class="grid md:grid-cols-2 gap-6" transition:fade>
                <div class="card group relative">
                    <button class="edit-btn" on:click={() => toggleEdit('description')}>
                        {#if editMode.description}Cancel{:else}Edit{/if}
                    </button>
                    <h2 class="text-xl font-semibold mb-2">Descripción</h2>
                    {#if editMode.description}
                        <div class="space-y-3">
                            <input
                                bind:value={editValues.displayName}
                                placeholder="Display Name"
                                class="input-field w-full"
                                minlength="2"
                                maxlength="50"
                            />
                            <textarea
                                bind:value={editValues.description}
                                placeholder="Description (min 20 characters)"
                                class="input-field w-full h-24 resize-none"
                                minlength="20"
                            ></textarea>
                            <input
                                bind:value={editValues.publicPhoneNumber}
                                placeholder="Public Phone Number"
                                class="input-field w-full"
                                type="tel"
                            />
                            <div class="flex">
                                <button 
                                    class="save-btn"
                                    on:click={() => saveChanges('description')}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button 
                                    class="cancel-btn"
                                    on:click={() => toggleEdit('description')}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    {:else}
                        <p class="text-gray-400 leading-relaxed mb-2">{escort.description}</p>
                        <p class="text-gray-400 text-sm"><strong class="text-white">Display Name:</strong> {escort.displayName}</p>
                        <p class="text-gray-400 text-sm"><strong class="text-white">Phone:</strong> {escort.publicPhoneNumber || 'Not set'}</p>
                    {/if}
                </div>
                <div class="card">
                    <h2 class="text-xl font-semibold mb-2">Info Básica</h2>
                    <ul class="space-y-1 text-gray-400">
                        <li><strong class="text-white">Nombre:</strong> {escort.basicInfo.name} {escort.basicInfo.surname}</li>
                        <li><strong class="text-white">Edad:</strong> {escort.basicInfo.age} años</li>
                        <li><strong class="text-white">Documento:</strong> {escort.basicInfo.documentation}</li>
                    </ul>
                </div>
                <div class="card group relative">
                    <button class="edit-btn" on:click={() => toggleEdit('appearance')}>
                        {#if editMode.appearance}Cancel{:else}Edit{/if}
                    </button>
                    <h2 class="text-xl font-semibold mb-2">Apariencia</h2>
                    {#if editMode.appearance}
                        <div class="space-y-3">
                            <div class="grid grid-cols-2 gap-2">
                                <input
                                    bind:value={editValues.heightInCm}
                                    placeholder="Height (cm)"
                                    class="input-field"
                                    type="number"
                                    min="140"
                                    max="220"
                                />
                                <input
                                    bind:value={editValues.weightInKg}
                                    placeholder="Weight (kg)"
                                    class="input-field"
                                    type="number"
                                    min="30"
                                    max="150"
                                />
                            </div>
                            <div class="grid grid-cols-3 gap-2">
                                <input
                                    bind:value={editValues.bust}
                                    placeholder="Bust (cm)"
                                    class="input-field"
                                    type="number"
                                    min="40"
                                    max="150"
                                />
                                <input
                                    bind:value={editValues.waist}
                                    placeholder="Waist (cm)"
                                    class="input-field"
                                    type="number"
                                    min="40"
                                    max="150"
                                />
                                <input
                                    bind:value={editValues.hips}
                                    placeholder="Hips (cm)"
                                    class="input-field"
                                    type="number"
                                    min="40"
                                    max="150"
                                />
                            </div>
                            <div class="flex">
                                <button 
                                    class="save-btn"
                                    on:click={() => saveChanges('appearance')}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button 
                                    class="cancel-btn"
                                    on:click={() => toggleEdit('appearance')}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    {:else}
                        <ul class="space-y-1 text-gray-400">
                            <li><strong class="text-white">Altura:</strong> {escort.appearance.heightInCm} cm</li>
                            <li><strong class="text-white">Peso:</strong> {escort.appearance.weightInKg} kg</li>
                            <li><strong class="text-white">Cabello:</strong> {escort.appearance.hairColor}</li>
                            <li><strong class="text-white">Ojos:</strong> {escort.appearance.eyeColor}</li>
                            <li><strong class="text-white">Métricas:</strong> {escort.appearance.bust}/{escort.appearance.waist}/{escort.appearance.hips} cm</li>
                        </ul>
                    {/if}
                </div>
                <div class="card group relative">
                    <button class="edit-btn" on:click={() => toggleEdit('contact')}>
                        {#if editMode.contact}Cancel{:else}Edit{/if}
                    </button>
                    <h2 class="text-xl font-semibold mb-2">Contacto</h2>
                    {#if editMode.contact}
                        <div class="space-y-3">
                            {#each editValues.contactMethod as contact, i}
                                <div class="flex gap-2">
                                    <select bind:value={contact.type} class="input-field">
                                        <option value="WHATSAPP">WhatsApp</option>
                                        <option value="TELEGRAM">Telegram</option>
                                        <option value="SMS">Mensaje de Texto</option>
                                    </select>
                                    <input
                                        bind:value={contact.value}
                                        placeholder="Contact value"
                                        class="input-field flex-1"
                                    />
                                    <button
                                        class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                        on:click={() => editValues.contactMethod = editValues.contactMethod.filter((_, idx) => idx !== i)}
                                    >
                                        ×
                                    </button>
                                </div>
                            {/each}
                            <button
                                class="text-white bg-neutral-700 hover:bg-neutral-600 px-3 py-1 rounded text-sm"
                                on:click={() => editValues.contactMethod = [...editValues.contactMethod, { type: 'WHATSAPP', value: '' }]}
                            >
                                + Add Contact
                            </button>
                            <div class="flex">
                                <button 
                                    class="save-btn"
                                    on:click={() => saveChanges('contact')}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button 
                                    class="cancel-btn"
                                    on:click={() => toggleEdit('contact')}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    {:else}
                        {#each escort.contactMethod as c}
                            <div class="flex items-center justify-between">
                                <p class="text-gray-400"><strong class="text-white">{c.type}:</strong> {c.value}</p>
                                <button
                                    class="text-red-400 hover:text-red-300 text-sm"
                                    on:click={() => removeContactMethod(c.type)}
                                    disabled={isSaving}
                                >
                                    Eliminar
                                </button>
                            </div>
                        {/each}
                    {/if}
                </div>
            </section>
        {/if}

        {#if activeTab === 'Media'}
            <section class="space-y-6" transition:fade>
                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">Profile Picture</h2>
                    <div class="flex gap-4 items-center">
                        <img
                            src={getMediaUrl(escort.id, escort.media.profilePicture, 'profile')}
                            alt="Current profile"
                            class="w-24 h-24 rounded-full object-cover"
                        />
                        <div class="space-y-2">
                            <input
                                bind:value={newProfilePic}
                                placeholder="Enter new profile picture URL"
                                class="input-field w-64"
                            />
                            <button
                                class="save-btn"
                                on:click={updateMediaFiles}
                                disabled={isSaving || !newProfilePic}
                            >
                                {isSaving ? 'Updating...' : 'Update Profile Picture'}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">Photos</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {#each escort.media.pics as pic}
                            <div class="relative">
                                <img
                                    src={getMediaUrl(escort.id, pic.media, 'pics')}
                                    alt="Foto {pic.order}"
                                    class="rounded-lg hover:opacity-90 transition-opacity"
                                />
                                <button
                                    class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs"
                                    on:click={() => deletePhoto(pic.media)}
                                    disabled={isSaving}
                                >
                                    ×
                                </button>
                            </div>
                        {/each}
                    </div>
                    
                    {#if photosToAdd.length > 0}
                        <div class="mb-4">
                            <h3 class="text-white mb-2">Photos to Add:</h3>
                            <div class="space-y-2">
                                {#each photosToAdd as photo}
                                    <div class="flex items-center gap-2 text-gray-300">
                                        <span class="text-sm">{photo.url}</span>
                                        <button
                                            class="text-red-400 hover:text-red-300"
                                            on:click={() => photosToAdd = photosToAdd.filter(p => p !== photo)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if photosToRemove.length > 0}
                        <div class="mb-4">
                            <h3 class="text-white mb-2">Photos to Remove:</h3>
                            <div class="space-y-2">
                                {#each photosToRemove as photo}
                                    <div class="flex items-center gap-2 text-gray-300">
                                        <span class="text-sm">{photo.url}</span>
                                        <button
                                            class="text-green-400 hover:text-green-300"
                                            on:click={() => photosToRemove = photosToRemove.filter(p => p !== photo)}
                                        >
                                            Keep
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <div class="flex gap-2">
                        <button
                            class="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded"
                            on:click={addPhotoToUpload}
                        >
                            + Add Photo
                        </button>
                        <button
                            class="save-btn"
                            on:click={updateMediaFiles}
                            disabled={isSaving || (photosToAdd.length === 0 && photosToRemove.length === 0 && !newProfilePic)}
                        >
                            {isSaving ? 'Updating...' : 'Update Media'}
                        </button>
                    </div>
                </div>

                {#if escort.media.videos && escort.media.videos.length > 0}
                    <div class="card">
                        <h2 class="text-xl font-semibold mb-4">Videos</h2>
                        {#each escort.media.videos as video}
                            <div class="relative mb-4">
                                <video
                                    src={getMediaUrl(escort.id, video.media, 'pics')}
                                    controls
                                    class="w-full rounded-lg hover:opacity-90 transition-opacity"
                                ></video>
                                <button
                                    class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                    on:click={() => deleteVideo(video.media)}
                                    disabled={isSaving}
                                >
                                    Eliminar Video
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if escort.media.audios && escort.media.audios.length > 0}
                    <div class="card">
                        <h2 class="text-xl font-semibold mb-4">Audio Clips</h2>
                        {#each escort.media.audios as audio}
                            <div class="flex items-center justify-between mb-2 p-2 bg-neutral-800 rounded">
                                <audio
                                    src={getMediaUrl(escort.id, audio.media, 'pics')}
                                    controls
                                    class="flex-1"
                                ></audio>
                                <button
                                    class="ml-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                    on:click={() => deleteAudio(audio.media)}
                                    disabled={isSaving}
                                >
                                    Eliminar
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}
            </section>
        {/if}

        {#if activeTab === 'Servicios'}
            <section class="space-y-6" transition:fade>
                <div class="card group relative">
                    <button class="edit-btn" on:click={() => toggleEdit('services')}>
                        {#if editMode.services}Cancel{:else}Edit{/if}
                    </button>
                    <h2 class="text-xl font-semibold mb-4">Servicios & Fantasías</h2>
                    
                    {#if !editMode.services}
                        <div class="flex flex-wrap gap-2 mb-4">
                            {#each [...escort.servicesInfo.escortServices, ...escort.servicesInfo.escortFantasies, ...escort.servicesInfo.massageType, ...escort.servicesInfo.virtualServices] as service}
                                <span class="badge">{service.replace(/_/g, ' ')}</span>
                            {/each}
                        </div>
                        <p class="text-gray-400">
                            <strong class="text-white">Precio por hora:</strong>
                            {formatPrice(escort.servicesInfo.hourPrice.amount, escort.servicesInfo.hourPrice.currency)}
                        </p>
                        {#if escort.servicesInfo.customRate && escort.servicesInfo.customRate.length > 0}
                            <div class="mt-4">
                                <h4 class="text-white font-semibold mb-2">Tarifas Personalizadas:</h4>
                                {#each escort.servicesInfo.customRate as rate}
                                    <p class="text-gray-400 text-sm">
                                        <strong class="text-white">{rate.serviceName}:</strong> {rate.duration} - 
                                        Incall: {formatPrice(rate.incallPrice)}, Outcall: {formatPrice(rate.incallPrice)}
                                    </p>
                                {/each}
                            </div>
                        {/if}
                    {:else}
                        <div class="space-y-6">
                            <!-- Pricing Section -->
                            <div class="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                                <h3 class="text-lg font-semibold text-white mb-3">💰 Precio por hora</h3>
                                <div class="flex gap-3 items-center flex-wrap">
                                    <div class="flex-1 min-w-40">
                                        <label class="block text-sm text-gray-300 mb-1">Tarifa</label>
                                        <div class="relative">
                                            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 font-bold">$</span>
                                            <input
                                                bind:value={editValues.hourPrice}
                                                placeholder="150"
                                                class="input-field pl-8 w-full"
                                                type="number"
                                                min="10"
                                                step="5"
                                            />
                                        </div>
                                        <p class="text-xs text-gray-400 mt-1">Mínimo: $10</p>
                                    </div>
                                    <div class="min-w-32">
                                        <label class="block text-sm text-gray-300 mb-1">Moneda</label>
                                        <select bind:value={editValues.currency} class="input-field w-full">
                                            {#each currencies as currency}
                                                <option value={currency.value}>{currency.label}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>
                                <div class="mt-3 p-2 bg-green-900/20 border border-green-700/30 rounded">
                                    <p class="text-sm text-green-300">
                                        Vista previa: <strong>{formatPrice(editValues.hourPrice) || 0} {editValues.currency}/hora</strong>
                                    </p>
                                </div>
                            </div>

                            <!-- Escort Services -->
                            <div class="service-category">
                                <h3 class="text-lg font-semibold text-white mb-2">Escort Services</h3>
                                <div class="service-grid">
                                    {#each serviceOptions.escortServices as service}
                                        <label class="flex items-center gap-2 service-label">
                                            <input
                                                type="checkbox"
                                                class="service-checkbox"
                                                checked={editValues.escortServices.includes(service.value)}
                                                on:change={() => toggleService('escortServices', service.value)}
                                            />
                                            {service.label}
                                        </label>
                                    {/each}
                                </div>
                            </div>

                            <!-- Fantasies -->
                            <div class="service-category">
                                <h3 class="text-lg font-semibold text-white mb-2">Fantasies</h3>
                                <div class="service-grid">
                                    {#each serviceOptions.escortFantasies as fantasy}
                                        <label class="flex items-center gap-2 service-label">
                                            <input
                                                type="checkbox"
                                                class="service-checkbox"
                                                checked={editValues.escortFantasies.includes(fantasy.value)}
                                                on:change={() => toggleService('escortFantasies', fantasy.value)}
                                            />
                                            {fantasy.label}
                                        </label>
                                    {/each}
                                </div>
                            </div>

                            <!-- Massage Types -->
                            <div class="service-category">
                                <h3 class="text-lg font-semibold text-white mb-2">Massage Types</h3>
                                <div class="service-grid">
                                    {#each serviceOptions.massageType as massage}
                                        <label class="flex items-center gap-2 service-label">
                                            <input
                                                type="checkbox"
                                                class="service-checkbox"
                                                checked={editValues.massageType.includes(massage.value)}
                                                on:change={() => toggleService('massageType', massage.value)}
                                            />
                                            {massage.label}
                                        </label>
                                    {/each}
                                </div>
                            </div>

                            <!-- Virtual Services -->
                            <div class="service-category">
                                <h3 class="text-lg font-semibold text-white mb-2">Virtual Services</h3>
                                <div class="service-grid">
                                    {#each serviceOptions.virtualServices as virtual}
                                        <label class="flex items-center gap-2 service-label">
                                            <input
                                                type="checkbox"
                                                class="service-checkbox"
                                                checked={editValues.virtualServices.includes(virtual.value)}
                                                on:change={() => toggleService('virtualServices', virtual.value)}
                                            />
                                            {virtual.label}
                                        </label>
                                    {/each}
                                </div>
                            </div>

                            <!-- Custom Rates -->
                            <div class="service-category">
                                <h3 class="text-lg font-semibold text-white mb-2">Tarifas Personalizadas</h3>
                                <div class="space-y-3">
                                    {#each editValues.customRate as rate, i}
                                        <div class="bg-neutral-700 p-3 rounded border border-neutral-600">
                                            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div>
                                                    <label class="block text-sm text-gray-300 mb-1">Servicio</label>
                                                    <input
                                                        bind:value={rate.serviceName}
                                                        placeholder="e.g., date, overnight"
                                                        class="input-field w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <label class="block text-sm text-gray-300 mb-1">Duración</label>
                                                    <input
                                                        bind:value={rate.duration}
                                                        placeholder="e.g., 24h, 2h"
                                                        class="input-field w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <label class="block text-sm text-gray-300 mb-1">Precio Incall</label>
                                                    <input
                                                        bind:value={rate.incallPrice}
                                                        placeholder="50.0"
                                                        class="input-field w-full"
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label class="block text-sm text-gray-300 mb-1">Precio Outcall</label>
                                                    <input
                                                        bind:value={rate.outcallPrice}
                                                        placeholder="60.0"
                                                        class="input-field w-full"
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                class="mt-2 text-red-400 hover:text-red-300 text-sm"
                                                on:click={() => editValues.customRate = editValues.customRate.filter((_, idx) => idx !== i)}
                                            >
                                                Eliminar tarifa
                                            </button>
                                        </div>
                                    {/each}
                                    <button
                                        class="text-white bg-neutral-700 hover:bg-neutral-600 px-3 py-2 rounded text-sm"
                                        on:click={() => editValues.customRate = [...editValues.customRate, { serviceName: '', duration: '', incallPrice: 0, outcallPrice: 0 }]}
                                    >
                                        + Agregar Tarifa Personalizada
                                    </button>
                                </div>
                            </div>

                            <!-- Save/Cancel -->
                            <div class="flex">
                                <button 
                                    class="save-btn"
                                    on:click={() => saveChanges('services')}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button 
                                    class="cancel-btn"
                                    on:click={() => toggleEdit('services')}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            </section>
        {/if}

        {#if activeTab === 'Disponibilidad'}
            <section class="space-y-6" transition:fade>
                <div class="card group relative">
                    <button class="edit-btn" on:click={() => editingAvailability = !editingAvailability}>
                        {#if editingAvailability}Cancel{:else}Edit{/if}
                    </button>
                    
                    <h2 class="text-xl font-semibold mb-4">Service Preferences</h2>
                    
                    {#if !editingAvailability}
                        <div class="space-y-2 text-gray-400">
                            <p><strong class="text-white">Only Virtual:</strong> {escort.availability.onlyVirtual ? 'Yes' : 'No'}</p>
                            <p><strong class="text-white">Only In-Person:</strong> {escort.availability.onlyInPerson ? 'Yes' : 'No'}</p>
                            <p><strong class="text-white">Own Apartment:</strong> {escort.availability.ownApartment ? 'Yes' : 'No'}</p>
                            <p><strong class="text-white">Motels:</strong> {escort.availability.motels ? 'Yes' : 'No'}</p>
                            <p><strong class="text-white">Client Place:</strong> {escort.availability.clientPlace ? 'Yes' : 'No'}</p>
                        </div>
                    {:else}
                        <div class="space-y-4">
                            <label class="flex items-center gap-2 text-white">
                                <input type="checkbox" bind:checked={availabilityData.onlyVirtual} class="service-checkbox" />
                                Only Virtual Services
                            </label>
                            <label class="flex items-center gap-2 text-white">
                                <input type="checkbox" bind:checked={availabilityData.onlyInPerson} class="service-checkbox" />
                                Only In-Person Services
                            </label>
                            <label class="flex items-center gap-2 text-white">
                                <input type="checkbox" bind:checked={availabilityData.ownApartment} class="service-checkbox" />
                                Own Apartment Available
                            </label>
                            <label class="flex items-center gap-2 text-white">
                                <input type="checkbox" bind:checked={availabilityData.motels} class="service-checkbox" />
                                Available at Motels
                            </label>
                            <label class="flex items-center gap-2 text-white">
                                <input type="checkbox" bind:checked={availabilityData.clientPlace} class="service-checkbox" />
                                Available at Client's Place
                            </label>
                            
                            <div class="flex">
                                <button 
                                    class="save-btn"
                                    on:click={saveAvailability}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button 
                                    class="cancel-btn"
                                    on:click={() => editingAvailability = false}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">Weekly Schedule</h2>
                    {#if !editingAvailability}
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {#each escort.availability.schedule as day}
                                <div class="card text-center bg-neutral-800">
                                    <p class="font-semibold text-white">{day.day}</p>
                                    <p class="text-gray-400">{day.slots[0]?.startHourWithMinutes || 'Not set'}</p>
                                    <p class="text-xs text-gray-500">
                                        {day.slots[0]?.isAvailable ? 'Available' : 'Unavailable'}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="space-y-4">
                            {#each availabilityData.schedule as day, i}
                                <div class="flex items-center gap-4 p-3 bg-neutral-800 rounded">
                                    <div class="w-24">
                                        <span class="text-white font-medium">{day.dayOfWeek}</span>
                                    </div>
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox" bind:checked={day.isAvailable} class="service-checkbox" />
                                        <span class="text-white text-sm">Available</span>
                                    </label>
                                    <input
                                        type="time"
                                        bind:value={day.startTime}
                                        class="input-field"
                                        disabled={!day.isAvailable}
                                    />
                                    <span class="text-gray-400">to</span>
                                    <input
                                        type="time"
                                        bind:value={day.endTime}
                                        class="input-field"
                                        disabled={!day.isAvailable}
                                    />
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </section>
        {/if}

        {#if activeTab === 'Ubicación'}
            <section class="space-y-6" transition:fade>
                <div class="card group relative">
                    <button class="edit-btn" on:click={() => toggleEdit('location')}>
                        {#if editMode.location}Cancel{:else}Edit{/if}
                    </button>
                    <h2 class="text-xl font-semibold mb-4">🔄 Actualizar Ubicación</h2>
                    {#if editMode.location}
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm text-gray-300 mb-2">País</label>
                                <input
                                    bind:value={editValues.country}
                                    placeholder="País"
                                    class="input-field w-full opacity-50 cursor-not-allowed"
                                    disabled
                                />
                                <p class="text-xs text-gray-500 mt-1">El país no se puede cambiar</p>
                            </div>
                            <div>
                                <label class="block text-sm text-gray-300 mb-2">Estado/Provincia</label>
                                <input
                                    bind:value={editValues.state}
                                    placeholder="Estado/Provincia (ej: Buenos Aires)"
                                    class="input-field w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label class="block text-sm text-gray-300 mb-2">Ciudad</label>
                                <input
                                    bind:value={editValues.city}
                                    placeholder="Ciudad (ej: CABA)"
                                    class="input-field w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label class="block text-sm text-gray-300 mb-2">Barrio</label>
                                <input
                                    bind:value={editValues.hood}
                                    placeholder="Barrio (ej: Palermo)"
                                    class="input-field w-full"
                                    required
                                />
                            </div>
                            <div class="flex">
                                <button 
                                    class="save-btn"
                                    on:click={() => saveChanges('location')}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Ubicación'}
                                </button>
                                <button 
                                    class="cancel-btn"
                                    on:click={() => toggleEdit('location')}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="space-y-4">
                            <div class="grid md:grid-cols-2 gap-4 text-gray-400">
                                <div>
                                    <strong class="text-white block mb-1">País:</strong>
                                    <span class="text-lg">{escort.location.country}</span>
                                </div>
                                <div>
                                    <strong class="text-white block mb-1">Estado:</strong>
                                    <span class="text-lg">{escort.location.state}</span>
                                </div>
                                <div>
                                    <strong class="text-white block mb-1">Ciudad:</strong>
                                    <span class="text-lg">{escort.location.city}</span>
                                </div>
                                <div>
                                    <strong class="text-white block mb-1">Barrio:</strong>
                                    <span class="text-lg">{escort.location.hood}</span>
                                </div>
                            </div>
                            <div class="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded">
                                <p class="text-sm text-blue-300">
                                    💡 <strong>Nota:</strong> Mantén tu ubicación actualizada para que los clientes puedan encontrarte más fácilmente. El país no se puede modificar.
                                </p>
                            </div>
                        </div>
                    {/if}
                </div>
            </section>
        {/if}

        {#if saveMessage}
            <div class="save-message" class:save-success={saveMessage.includes('success')} class:save-error={!saveMessage.includes('success')} transition:fade>
                {saveMessage}
            </div>
        {/if}
    </div>
{/if}
