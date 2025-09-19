<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
    import { logout } from '$lib/escort/api/authApi';
    import { updateInfo, updateAppearance, updateAvailability, updateMedia, updateServicesInfo, updateContactMethod, deleteMediaFile, deleteContactMethod, updateLocation, uploadMedia, type UpdateInfoRequest, type UpdateAppearanceRequest, type UpdateServicesInfoRequest, type ContactMethodRequest, type UpdateLocationRequest, type UploadMediaDTO, type MediaWithOrder, type EscortMedia } from '$lib/escort/api/profileApi';
    import { goto } from '$app/navigation';
    import { onMount, onDestroy } from 'svelte';
    import {formatPrice} from "../../util/PriceUtils";
    import { toast } from 'svelte-sonner'
    import {getMediaUrl} from "../../util/MediaUtils";

    let activeTab = 'Perfil';
    const tabs = ['Perfil', 'Media', 'Servicios', 'Disponibilidad', 'Ubicación'];

    $: authState = $escortAuthStore;
    $: escort = authState.user?.profile || null;
    $: if (escort?.media) {
        console.log('Escort media updated:', escort.media.pics?.length || 0, 'pics');
    }
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

    // Service options - loaded dynamically from API
    let serviceOptions = {
        escortServices: [],
        escortFantasies: [],
        massageType: [],
        virtualServices: []
    };

    // Load service options from API
    onMount(async () => {
        try {
            const [services, fantasies, massages, virtual] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/escort/types/services?lang=es_ar&activeOnly=true`).then(r => r.json()),
                fetch(`${import.meta.env.VITE_API_URL}/escort/types/fantasy-types?lang=es_ar&activeOnly=true`).then(r => r.json()),
                fetch(`${import.meta.env.VITE_API_URL}/escort/types/massage?lang=es_ar&activeOnly=true`).then(r => r.json()),
                fetch(`${import.meta.env.VITE_API_URL}/escort/types/virtual-services?lang=es_ar&activeOnly=true`).then(r => r.json())
            ]);

            serviceOptions = {
                escortServices: services || [],
                escortFantasies: fantasies || [],
                massageType: massages || [],
                virtualServices: virtual || []
            };
        } catch (error) {
            console.error('Failed to load service options:', error);
            // Keep empty arrays as fallback
        }
    });

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
            escortServices: [...(escort.servicesInfo.escortServices?.map(s => typeof s === 'string' ? s : s.code || s) || [])],
            escortFantasies: [...(escort.servicesInfo.escortFantasies?.map(s => typeof s === 'string' ? s : s.code || s) || [])],
            massageType: [...(escort.servicesInfo.massageType?.map(s => typeof s === 'string' ? s : s.code || s) || [])],
            virtualServices: [...(escort.servicesInfo.virtualServices?.map(s => typeof s === 'string' ? s : s.code || s) || [])],
            customRate: [...(escort.servicesInfo.customRate || [])],
            contactMethod: escort.contactMethod.map(c => ({ ...c })),
            country: escort.location.country,
            state: escort.location.state,
            city: escort.location.city,
            hood: escort.location.hood
        };
    }

    let isLoggingOut = false;

    let isToggling = false;

    async function toggleActive() {
        if (!escort) return;
        isToggling = true;
        try {
            const newStatus = !escort.isActive;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/escort/active/${newStatus}`, {
                method: 'PATCH',
                credentials: 'include'
            });
            if (res.ok) {
                escortAuthStore.updateProfile({
                    ...escort,
                    isActive: newStatus
                });
                toast.success(`Perfil ${newStatus ? 'activado' : 'desactivado'} correctamente`);
            } else {
                toast.error('No se pudo actualizar el estado');
            }
        } catch (e) {
            console.error('Toggle active failed:', e);
            toast.error('Error al cambiar el estado');
        } finally {
            isToggling = false;
        }
    }

    const handleLogout = async () => {
        isLoggingOut = true;
        try {
            await logout();
            escortAuthStore.logout();
            goto('/dashboard/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            isLoggingOut = false;
        }
    };

    // Media handling functions
    let newProfilePic = '';
    let newProfilePicPreview = '';
    let photosToAdd: MediaWithOrder[] = [];
    let photoPreviews: { file: File, preview: string, order: number }[] = [];
    let videosToAdd: MediaWithOrder[] = [];
    let videoPreviews: { file: File, preview: string, order: number }[] = [];
    let audioToAdd = '';
    let audioPreview: { file: File, name: string } | null = null;
    let fileInput: HTMLInputElement;
    let videoFileInput: HTMLInputElement;
    let audioFileInput: HTMLInputElement;
    let profileFileInput: HTMLInputElement;
    let isUploading = false;

    async function uploadMediaFiles() {
        if (!escort) return;

        isUploading = true;
        saveMessage = '';

        try {
            const uploadData: UploadMediaDTO = {};

            // Handle profile picture upload
            if (newProfilePic) {
                uploadData.profilePicture = newProfilePic;
            }

            // Handle photos to add
            if (photosToAdd.length > 0) {
                uploadData.pics = photosToAdd;
            }

            // Handle videos to add
            if (videosToAdd.length > 0) {
                uploadData.videos = videosToAdd;
            }

            // Handle audio to add (only one audio clip allowed)
            if (audioToAdd) {
                uploadData.audioCLip = audioToAdd;
            }

            const result = await uploadMedia(uploadData);

            // Update local state with the new media data from the response
            if (result) {
                console.log('Upload result:', result);
                console.log('Current escort media:', escort.media);

                const updatedMedia = {
                    ...escort.media,
                    profilePicture: result.profilePicture || escort.media.profilePicture,
                    pics: result.pics || escort.media.pics,
                    videos: result.videos || escort.media.videos,
                    audioClip: result.audioClip || escort.media.audioClip
                };

                console.log('Updated media:', updatedMedia);

                // Update just the media property, not the entire escort object
                escortAuthStore.updateProfile({
                    ...escort,
                    media: updatedMedia
                });
                console.log('Auth store updated');
            }

            // Reset the temporary data
            newProfilePic = '';
            newProfilePicPreview = '';
            photosToAdd = [];
            photoPreviews = [];
            videosToAdd = [];
            videoPreviews = [];
            audioToAdd = '';
            audioPreview = null;

            // Clean up object URLs to prevent memory leaks
            photoPreviews.forEach(preview => {
                URL.revokeObjectURL(preview.preview);
            });
            videoPreviews.forEach(preview => {
                URL.revokeObjectURL(preview.preview);
            });

            saveMessage = 'Media uploaded successfully!';
            setTimeout(() => saveMessage = '', 3000);

        } catch (error) {
            console.error('Media upload failed:', error);
            saveMessage = error.message || 'Failed to upload media';
            setTimeout(() => saveMessage = '', 5000);
        } finally {
            isUploading = false;
        }
    }

    function triggerFileUpload() {
        fileInput?.click();
    }

    function triggerVideoUpload() {
        videoFileInput?.click();
    }

    function triggerAudioUpload() {
        audioFileInput?.click();
    }

    function triggerProfilePicUpload() {
        profileFileInput?.click();
    }

    async function handleProfilePicSelection(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        try {
            newProfilePic = await fileToBase64(file);
            newProfilePicPreview = URL.createObjectURL(file);

            // Auto-upload profile picture
            await uploadMediaFiles();
        } catch (error) {
            console.error('Profile picture upload failed:', error);
            saveMessage = 'Failed to upload profile picture';
            setTimeout(() => saveMessage = '', 5000);
        }

        target.value = '';
    }

    async function handleFileSelection(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (!files || files.length === 0) return;

        const newPreviews = [];
        const newPhotos = [];

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const base64 = await fileToBase64(file);
                const preview = URL.createObjectURL(file);
                const order = photosToAdd.length + newPhotos.length + 1;

                newPhotos.push({ media: base64, order });
                newPreviews.push({ file, preview, order });
            }
        }

        photosToAdd = [...photosToAdd, ...newPhotos];
        photoPreviews = [...photoPreviews, ...newPreviews];

        // Auto-upload photos
        if (newPhotos.length > 0) {
            await uploadMediaFiles();
        }

        target.value = '';
    }

    async function handleVideoSelection(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (!files || files.length === 0) return;

        const newPreviews = [];
        const newVideos = [];

        for (const file of files) {
            if (file.type.startsWith('video/')) {
                const base64 = await fileToBase64(file);
                const preview = URL.createObjectURL(file);
                const order = videosToAdd.length + newVideos.length + 1;

                newVideos.push({ media: base64, order });
                newPreviews.push({ file, preview, order });
            }
        }

        videosToAdd = [...videosToAdd, ...newVideos];
        videoPreviews = [...videoPreviews, ...newPreviews];

        // Auto-upload videos
        if (newVideos.length > 0) {
            await uploadMediaFiles();
        }

        target.value = '';
    }

    async function handleAudioSelection(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file || !file.type.startsWith('audio/')) return;

        try {
            audioToAdd = await fileToBase64(file);
            audioPreview = { file, name: file.name };

            // Auto-upload audio
            await uploadMediaFiles();
        } catch (error) {
            console.error('Audio upload failed:', error);
            saveMessage = 'Failed to upload audio';
            setTimeout(() => saveMessage = '', 5000);
        }

        target.value = '';
    }

    function removePhotoPreview(order: number) {
        photoPreviews = photoPreviews.filter(p => p.order !== order);
        photosToAdd = photosToAdd.filter(p => p.order !== order);

        // Clean up object URLs to prevent memory leaks
        const preview = photoPreviews.find(p => p.order === order);
        if (preview) {
            URL.revokeObjectURL(preview.preview);
        }
    }

    function removeVideoPreview(order: number) {
        videoPreviews = videoPreviews.filter(p => p.order !== order);
        videosToAdd = videosToAdd.filter(p => p.order !== order);

        // Clean up object URLs to prevent memory leaks
        const preview = videoPreviews.find(p => p.order === order);
        if (preview) {
            URL.revokeObjectURL(preview.preview);
        }
    }

    function removeAudioPreview() {
        audioToAdd = '';
        audioPreview = null;
    }

    function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Return the complete data URL including MIME type (e.g., data:image/jpeg;base64,...)
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }


    async function deletePhoto(fileName: string) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) return;

        isSaving = true;
        try {
            await deleteMediaFile(fileName);

            // Remove photo from local state
            const updatedPics = escort.media.pics.filter(pic => pic.media !== fileName);
            const updatedEscort = {
                ...escort,
                media: {
                    ...escort.media,
                    pics: updatedPics
                }
            };
            escortAuthStore.updateProfile(updatedEscort);

            saveMessage = 'Foto eliminada exitosamente';
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

            // Remove video from local state
            const updatedVideos = escort.media.videos?.filter(video => video.media !== fileName) || [];
            const updatedEscort = {
                ...escort,
                media: {
                    ...escort.media,
                    videos: updatedVideos
                }
            };
            escortAuthStore.updateProfile(updatedEscort);

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

            // Remove audio from local state
            const updatedEscort = {
                ...escort,
                media: {
                    ...escort.media,
                    audioClip: null
                }
            };
            escortAuthStore.updateProfile(updatedEscort);

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
            escortAuthStore.updateProfile(updatedEscort);

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
            { day: 'MONDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { day: 'TUESDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { day: 'WEDNESDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { day: 'THURSDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { day: 'FRIDAY', startTime: '09:00', endTime: '18:00', isAvailable: true },
            { day: 'SATURDAY', startTime: '10:00', endTime: '16:00', isAvailable: false },
            { day: 'SUNDAY', startTime: '10:00', endTime: '16:00', isAvailable: false }
        ]
    };

    async function saveAvailability() {
        if (!escort) return;

        isSaving = true;
        saveMessage = '';

        try {
            const transformedData = {
                onlyVirtual: availabilityData.onlyVirtual,
                onlyInPerson: availabilityData.onlyInPerson,
                ownApartment: availabilityData.ownApartment,
                motels: availabilityData.motels,
                clientPlace: availabilityData.clientPlace,
                schedule: availabilityData.schedule
                    .filter(day => day.isAvailable)
                    .map(day => ({
                        day: day.day,
                        slots: [{
                            startHourWithMinutes: day.startTime,
                            endHourWithMinutes: day.endTime
                        }]
                    }))
            };

            const updatedEscort = await updateAvailability(transformedData);

            if (updatedEscort) {
                escortAuthStore.updateProfile(updatedEscort);
            }

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
                    escortServices: [...(escort.servicesInfo.escortServices?.map(s => typeof s === 'string' ? s : s.code || s) || [])],
                    escortFantasies: [...(escort.servicesInfo.escortFantasies?.map(s => typeof s === 'string' ? s : s.code || s) || [])],
                    massageType: [...(escort.servicesInfo.massageType?.map(s => typeof s === 'string' ? s : s.code || s) || [])],
                    virtualServices: [...(escort.servicesInfo.virtualServices?.map(s => typeof s === 'string' ? s : s.code || s) || [])],
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
                escortAuthStore.updateProfile(updatedEscort);
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
    .dot {
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    }
    .stat-card {
        @apply bg-neutral-900 rounded-lg p-6 flex flex-col items-center justify-center border border-neutral-800 hover:border-neutral-600 transition;
        background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0));
    }
    .stat-number {
        @apply text-3xl font-bold text-white;
    }
    .stat-label {
        @apply text-gray-400 text-sm mt-1;
    }
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

    nav {
        overflow-x: auto;
        position: relative;
        padding: 0 1rem; /* deja espacio pa’ los gradientes */
        scroll-snap-type: x mandatory; /* opcional: que “encaje” cada tab */
    }
    nav::-webkit-scrollbar {
        height: 4px;
    }
    nav::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.3);
        border-radius: 2px;
    }
    nav::before,
    nav::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2rem;
        pointer-events: none;
    }
    nav::before {
        left: 0;
        background: linear-gradient(to right, #000, transparent);
    }
    nav::after {
        right: 0;
        background: linear-gradient(to left, #000, transparent);
    }
    /* Opcional: que cada botón “encaje” al hacer scroll */
    nav button {
        scroll-snap-align: start;
    }

</style>

<svelte:head>
    <title>Tu panel</title>
</svelte:head>

{#if authState.isLoading}
    <div class="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Cargando perfil...</p>
    </div>
{:else if !authState.isAuthenticated}
    <script>goto('/dashboard/login');</script>
{:else}
    <div class="min-h-screen bg-black text-white p-6 font-sans">
        <header class="flex justify-between items-center bg-black text-white p-6 rounded-2xl shadow-lg mb-8">
            <div class="flex items-center space-x-6">
                <img
                        src={getMediaUrl(escort.id, escort.media.profilePicture, 'profile')}
                        alt="Avatar"
                        class="w-24 h-24 rounded-full border-2 border-gray-700 object-cover"
                />
            </div>

            <div class="flex gap-4 items-center">
                <div class="flex items-center gap-2">
                    <label class="flex items-center cursor-pointer select-none">
                        <div class="relative">
                            <!-- input -->
                            <input
                                type="checkbox"
                                checked={escort.isActive}
                                disabled={isToggling}
                                on:change={toggleActive}
                                class="sr-only"
                            />
                            <!-- track -->
                            <div
                                class="block w-12 h-6 rounded-full transition-colors duration-200"
                                class:bg-green-600={escort.isActive}
                                class:bg-gray-600={!escort.isActive}
                            ></div>
                            <!-- knob -->
                            <div
                                class="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform duration-200"
                                class:translate-x-6={escort.isActive}
                            ></div>
                        </div>
                        <span class="ml-3 text-sm text-gray-300">
                            {escort.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </label>
                </div>
                <a
                        href="/escort/{escort.slug}"
                        target="_blank"
                        class="px-5 py-3 border border-gray-600 rounded-md uppercase text-sm tracking-wide transition-all hover:bg-white hover:text-black"
                >
                    Ver mi página
                </a>

                <button
                        on:click={handleLogout}
                        class="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-md uppercase text-sm tracking-wide transition-all disabled:opacity-50"
                        disabled={isLoggingOut}
                >
                    {#if isLoggingOut}Saliendo…{:else}Cerrar sesión{/if}
                </button>
            </div>
        </header>

        <!-- Stats section -->
        <section class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div class="stat-card">
                <div class="stat-number">{escort.pageViews || 0}</div>
                <p class="stat-label">Vistas de página</p>
            </div>
            <div class="stat-card">
                <div class="stat-number">{escort.contactClicks || 0}</div>
                <p class="stat-label">Clics en contacto</p>
            </div>
        </section>

        <nav class="overflow-x-auto scrolling-touch whitespace-nowrap -mx-6 px-6 border-b border-gray-700 mb-8">
            <div class="inline-flex space-x-6">
                {#each tabs as tab}
                    <button
                            on:click={() => (activeTab = tab)}
                            class="tab-btn flex-shrink-0 whitespace-nowrap"
                            class:tab-active={activeTab === tab}
                            class:tab-inactive={activeTab !== tab}
                            transition:scale={{ duration: 100 }}
                    >
                        {tab}
                    </button>
                {/each}
            </div>
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
                        <div class="relative">
                            <img
                                src={newProfilePicPreview || getMediaUrl(escort.id, escort.media.profilePicture, 'profile')}
                                alt="Profile"
                                class="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
                            />
                            {#if isUploading}
                                <div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                </div>
                            {/if}
                        </div>
                        <div class="space-y-2">
                            <input
                                type="file"
                                accept="image/*"
                                bind:this={profileFileInput}
                                on:change={handleProfilePicSelection}
                                class="hidden"
                            />
                            <button
                                class="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded disabled:opacity-50"
                                on:click={triggerProfilePicUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Choose Profile Picture'}
                            </button>
                            <p class="text-gray-400 text-sm">Click to select and auto-upload a new profile picture</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">Photos</h2>

                    <!-- Existing uploaded photos -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {#each escort.media.pics as pic}
                            <div class="relative group">
                                <img
                                    src={getMediaUrl(escort.id, pic.media, 'pics')}
                                    alt="Foto {pic.order}"
                                    class="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                                />
                                <button
                                    class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    on:click={() => deletePhoto(pic.media)}
                                    disabled={isSaving}
                                >
                                    ×
                                </button>
                            </div>
                        {/each}
                    </div>

                    <!-- Photo previews before upload -->
                    {#if photoPreviews.length > 0}
                        <div class="mb-4">
                            <h3 class="text-white mb-2 flex items-center gap-2">
                                <span>New Photos</span>
                                {#if isUploading}
                                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span class="text-sm text-gray-400">Uploading...</span>
                                {/if}
                            </h3>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {#each photoPreviews as preview}
                                    <div class="relative group">
                                        <img
                                            src={preview.preview}
                                            alt="Preview {preview.order}"
                                            class="w-full h-32 object-cover rounded-lg"
                                        />
                                        <div class="absolute inset-0 bg-blue-600 bg-opacity-20 rounded-lg flex items-center justify-center">
                                            <span class="text-white text-xs font-medium">Uploading...</span>
                                        </div>
                                        <button
                                            class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            on:click={() => removePhotoPreview(preview.order)}
                                            disabled={isUploading}
                                        >
                                            ×
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Upload button -->
                    <div class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            on:change={handleFileSelection}
                            class="hidden"
                            bind:this={fileInput}
                        />
                        <button
                            class="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded disabled:opacity-50"
                            on:click={triggerFileUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : '+ Add Photos'}
                        </button>
                        <p class="text-gray-400 text-sm mt-2">Select multiple images to auto-upload</p>
                    </div>
                </div>

                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">Videos</h2>

                    <!-- Existing uploaded videos -->
                    {#if escort.media.videos && escort.media.videos.length > 0}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {#each escort.media.videos as video}
                                <div class="relative group">
                                    <video
                                        src={getMediaUrl(escort.id, video.media, 'videos')}
                                        controls
                                        class="w-full h-48 rounded-lg hover:opacity-90 transition-opacity"
                                        preload="metadata"
                                    ></video>
                                    <button
                                        class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        on:click={() => deleteVideo(video.media)}
                                        disabled={isSaving}
                                    >
                                        ×
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    <!-- Video previews before upload -->
                    {#if videoPreviews.length > 0}
                        <div class="mb-4">
                            <h3 class="text-white mb-2 flex items-center gap-2">
                                <span>New Videos</span>
                                {#if isUploading}
                                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span class="text-sm text-gray-400">Uploading...</span>
                                {/if}
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {#each videoPreviews as preview}
                                    <div class="relative group">
                                        <video
                                            src={preview.preview}
                                            controls
                                            class="w-full h-48 rounded-lg"
                                            preload="metadata"
                                        ></video>
                                        <div class="absolute inset-0 bg-blue-600 bg-opacity-20 rounded-lg flex items-center justify-center">
                                            <span class="text-white text-xs font-medium">Uploading...</span>
                                        </div>
                                        <button
                                            class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            on:click={() => removeVideoPreview(preview.order)}
                                            disabled={isUploading}
                                        >
                                            ×
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Video upload button -->
                    <div class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            accept="video/*"
                            multiple
                            on:change={handleVideoSelection}
                            class="hidden"
                            bind:this={videoFileInput}
                        />
                        <button
                            class="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded disabled:opacity-50"
                            on:click={triggerVideoUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : '+ Add Videos'}
                        </button>
                        <p class="text-gray-400 text-sm mt-2">Select multiple videos to auto-upload</p>
                    </div>
                </div>

                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">Audio Clip</h2>

                    <!-- Current audio -->
                    {#if escort.media.audioClip}
                        <div class="mb-4">
                            <div class="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                                <audio
                                    src={getMediaUrl(escort.id, escort.media.audioClip, 'audio')}
                                    controls
                                    class="flex-1"
                                ></audio>
                                <button
                                    class="ml-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                    on:click={() => deleteAudio(escort.media.audioClip)}
                                    disabled={isSaving}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    {/if}

                    <!-- Audio preview before upload -->
                    {#if audioPreview}
                        <div class="mb-4">
                            <h3 class="text-white mb-2 flex items-center gap-2">
                                <span>New Audio</span>
                                {#if isUploading}
                                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span class="text-sm text-gray-400">Uploading...</span>
                                {/if}
                            </h3>
                            <div class="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                                <span class="text-white text-sm">{audioPreview.name}</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-400 text-xs">Uploading...</span>
                                    <button
                                        class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                        on:click={removeAudioPreview}
                                        disabled={isUploading}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Audio upload button (only show if no current audio) -->
                    {#if !escort.media.audioClip && !audioPreview}
                        <div class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                accept="audio/*"
                                on:change={handleAudioSelection}
                                class="hidden"
                                bind:this={audioFileInput}
                            />
                            <button
                                class="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                on:click={triggerAudioUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? 'Uploading...' : '+ Add Audio Clip'}
                            </button>
                            <p class="text-gray-400 text-sm mt-2">Select one audio file to upload (replaces existing)</p>
                        </div>
                    {:else if escort.media.audioClip}
                        <div class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                accept="audio/*"
                                on:change={handleAudioSelection}
                                class="hidden"
                                bind:this={audioFileInput}
                            />
                            <button
                                class="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                on:click={triggerAudioUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Replace Audio Clip'}
                            </button>
                            <p class="text-gray-400 text-sm mt-2">Select a new audio file to replace the current one</p>
                        </div>
                    {/if}
                </div>

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
                                <span class="badge">
                                    {#if typeof service === 'string'}
                                        {service.replace(/_/g, ' ')}
                                    {:else if service && typeof service === 'object'}
                                        {service.label || service.name || service.displayName || (service.code && service.code.replace(/_/g, ' ')) || JSON.stringify(service)}
                                    {:else}
                                        {String(service)}
                                    {/if}
                                </span>
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
                                                checked={editValues.escortServices.includes(service.value || service.code)}
                                                on:change={() => toggleService('escortServices', service.value || service.code)}
                                            />
                                            {service.label || service.name}
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
                                                checked={editValues.escortFantasies.includes(fantasy.value || fantasy.code)}
                                                on:change={() => toggleService('escortFantasies', fantasy.value || fantasy.code)}
                                            />
                                            {fantasy.label || fantasy.name}
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
                                                checked={editValues.massageType.includes(massage.value || massage.code)}
                                                on:change={() => toggleService('massageType', massage.value || massage.code)}
                                            />
                                            {massage.label || massage.name}
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
                                                checked={editValues.virtualServices.includes(virtual.value || virtual.code)}
                                                on:change={() => toggleService('virtualServices', virtual.value || virtual.code)}
                                            />
                                            {virtual.label || virtual.name}
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
                                        <span class="text-white font-medium">{day.day}</span>
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