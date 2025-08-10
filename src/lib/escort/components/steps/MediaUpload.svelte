<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import Button from '../Button.svelte';
    import { onMount } from 'svelte';
    import { toBase64 } from '../../utils/mediaUtils';
    import MediaModal from '../MediaModal.svelte';
    import Sortable from 'sortablejs';
    import {
        trackRegisterStepMediaUpload,
        trackRegisterStepMediaUploadProfilePic,
        trackRegisterStepMediaUploadExtraPics,
        trackRegisterStepMediaUploadVideos,
        trackRegisterStepMediaUploadAudio,
        trackRegisterStepMediaUploadKycIdPhoto,
        trackRegisterStepMediaUploadKycIdFront,
        trackRegisterStepMediaUploadKycIdBack
    } from '../../../analytics/analytics';
    
    export let formData;
    
    // Modal state
    let showModal = false;
    let previewSrc = '';
    let isVideo = false;
    
    // SortableJS elements
    let picsContainer;
    let videosContainer;
    let picsSort;
    let videosSort;
    
    // Step handlers
    function handleMediaNext() { 
        if (!formData.profilePicBase64) return alert('Subí tu foto de perfil');
        if (!formData.kycIdPhoto) return alert('Subí una foto tuya sosteniendo tu DNI');
        if (!formData.kycIdFront) return alert('Subí una foto del frente de tu DNI');
        if (!formData.kycIdBack) return alert('Subí una foto del dorso de tu DNI');
        stepStore.set(39); 
    }
    
    function openModal(src: string) {
        previewSrc = src;
        isVideo = src.startsWith('data:video');
        showModal = true;
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    // File upload handlers
    async function handleProfilePic(e) {
        const file = e.target.files[0];
        try { 
            formData.profilePicBase64 = await toBase64(file);
            trackRegisterStepMediaUploadProfilePic({ userType: 'Escort' });
        }
        catch(err) { alert(err); }
    }
    
    async function handlePics(e) {
        for (let f of e.target.files) {
            try {
                const b64 = await toBase64(f);
                formData.pics.push({ id: formData.mediaId++, base64: b64, order: formData.pics.length });
                formData.pics = [...formData.pics]; // Trigger reactivity
                trackRegisterStepMediaUploadExtraPics({ userType: 'Escort' });
            } catch(err) { alert(err); }
        }
    }
    
    async function handleVideos(e) {
        for (let f of e.target.files) {
            try {
                const b64 = await toBase64(f);
                formData.videos.push({ id: formData.mediaId++, base64: b64, order: formData.videos.length });
                formData.videos = [...formData.videos]; // Trigger reactivity
                trackRegisterStepMediaUploadVideos({ userType: 'Escort' });
            } catch(err) { alert(err); }
        }
    }
    
    async function handleAudio(e) {
        const file = e.target.files[0];
        try { 
            formData.audioClipBase64 = await toBase64(file);
            trackRegisterStepMediaUploadAudio({ userType: 'Escort' });
        }
        catch(err) { alert(err); }
    }
    
    async function handleKycIdPhoto(e) {
        const file = e.target.files[0];
        try { 
            formData.kycIdPhoto = await toBase64(file);
            trackRegisterStepMediaUploadKycIdPhoto({ userType: 'Escort' });
        }
        catch(err) { alert(err); }
    }
    
    async function handleKycIdFront(e) {
        const file = e.target.files[0];
        try { 
            formData.kycIdFront = await toBase64(file);
            trackRegisterStepMediaUploadKycIdFront({ userType: 'Escort' });
        }
        catch(err) { alert(err); }
    }
    
    async function handleKycIdBack(e) {
        const file = e.target.files[0];
        try { 
            formData.kycIdBack = await toBase64(file);
            trackRegisterStepMediaUploadKycIdBack({ userType: 'Escort' });
        }
        catch(err) { alert(err); }
    }
    
    onMount(() => {
        trackRegisterStepMediaUpload({ userType: 'Escort' });
        function initSortable() {
            if (picsContainer) {
                // Destroy existing instance if it exists
                if (picsSort && picsSort.destroy) {
                    picsSort.destroy();
                }
                
                picsSort = Sortable.create(picsContainer, {
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    handle: '.drag-handle',
                    onEnd: (evt) => {
                        // Update order after drag ends
                        formData.pics.forEach((p, i) => p.order = i);
                        formData.pics = [...formData.pics]; // Trigger reactivity
                    }
                });
            }
            
            if (videosContainer) {
                // Destroy existing instance if it exists
                if (videosSort && videosSort.destroy) {
                    videosSort.destroy();
                }
                
                videosSort = Sortable.create(videosContainer, {
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    handle: '.drag-handle',
                    onEnd: (evt) => {
                        formData.videos.forEach((v, i) => v.order = i);
                        formData.videos = [...formData.videos]; // Trigger reactivity
                    }
                });
            }
        }
        
        // Initialize sortable on first render
        initSortable();
        
        // Re-initialize when step changes to media upload
        const unsubscribe = stepStore.subscribe(value => {
            if (value === 38) {
                // Use setTimeout to ensure DOM is updated
                setTimeout(initSortable, 100);
            }
        });
        
        return () => {
            if (unsubscribe) unsubscribe();
        };
    });
</script>

<!-- Paso 38: Media upload -->
{#if $stepStore === 38}
    <h2 class="text-3xl font-bold text-white mb-6">Subí tus fotos y media</h2>
    <p class="text-gray-400 mb-4">Perfil (≤5MB), extras (≤5MB), videos (≤20MB), audio (≤5MB).</p>

    <!-- Profile Pic -->
    <input type="file" accept="image/*" on:change={handleProfilePic} class="mb-4 w-full text-sm"/>
    {#if formData.profilePicBase64}
        <img 
            src={formData.profilePicBase64} 
            alt="perfil" 
            on:click={() => openModal(formData.profilePicBase64)}
            class="w-32 h-32 rounded-full mx-auto mb-4 cursor-pointer ring-2 ring-white"
        />
    {/if}

    <!-- Extra Pics -->
    <input type="file" multiple accept="image/*" on:change={handlePics} class="mb-2 w-full text-sm"/>
    <div class="mb-2 text-gray-400 text-sm">Arrastra para cambiar el orden de las fotos</div>
    <div bind:this={picsContainer} class="grid grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
        {#each formData.pics as pic}
            <div class="relative" data-id={pic.id}>
                <span class="absolute top-1 right-1 cursor-move text-white z-10 drag-handle bg-black bg-opacity-50 p-1 rounded-full">☰</span>
                <div class="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                    {pic.order + 1}
                </div>
                <img 
                    src={pic.base64} 
                    alt="extra" 
                    on:click={() => openModal(pic.base64)}
                    class="w-full h-24 object-cover rounded cursor-pointer hover:ring-2 hover:ring-white"
                />
            </div>
        {/each}
    </div>

    <!-- Videos -->
    <input type="file" multiple accept="video/*" on:change={handleVideos} class="mb-2 w-full text-sm"/>
    <div class="mb-2 text-gray-400 text-sm">Arrastra para cambiar el orden de los videos</div>
    <div bind:this={videosContainer} class="grid grid-cols-2 gap-2 mb-4">
        {#each formData.videos as vid}
            <div class="relative" data-id={vid.id}>
                <span class="absolute top-1 right-1 cursor-move text-white z-10 drag-handle bg-black bg-opacity-50 p-1 rounded-full">☰</span>
                <div class="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                    {vid.order + 1}
                </div>
                <div on:click={() => openModal(vid.base64)} class="cursor-pointer">
                    <video src={vid.base64} class="w-full h-32 rounded hover:ring-2 hover:ring-white"/>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="bg-black bg-opacity-50 rounded-full p-2">▶️</span>
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Audio -->
    <input type="file" accept="audio/*" on:change={handleAudio} class="mb-2 w-full text-sm"/>
    {#if formData.audioClipBase64}
        <audio src={formData.audioClipBase64} controls class="w-full mb-4"/>
    {/if}
    
    <!-- KYC Verification -->
    <h3 class="text-xl font-bold text-white mt-6 mb-3">Verificación de identidad (KYC)</h3>
    <p class="text-gray-400 mb-4">Por favor, subí las siguientes fotos para verificar tu identidad:</p>
    
    <div class="bg-gray-900 p-4 rounded mb-4">
        <h4 class="text-lg text-white mb-2">1. Foto tuya sosteniendo tu DNI</h4>
        <input type="file" accept="image/*" on:change={handleKycIdPhoto} class="mb-2 w-full text-sm"/>
        {#if formData.kycIdPhoto}
            <img 
                src={formData.kycIdPhoto} 
                alt="KYC con DNI" 
                on:click={() => openModal(formData.kycIdPhoto)}
                class="h-32 mx-auto object-contain rounded cursor-pointer hover:ring-2 hover:ring-white"
            />
        {/if}
    </div>
    
    <div class="bg-gray-900 p-4 rounded mb-4">
        <h4 class="text-lg text-white mb-2">2. Frente de tu DNI</h4>
        <input type="file" accept="image/*" on:change={handleKycIdFront} class="mb-2 w-full text-sm"/>
        {#if formData.kycIdFront}
            <img 
                src={formData.kycIdFront} 
                alt="Frente DNI" 
                on:click={() => openModal(formData.kycIdFront)}
                class="h-32 mx-auto object-contain rounded cursor-pointer hover:ring-2 hover:ring-white"
            />
        {/if}
    </div>
    
    <div class="bg-gray-900 p-4 rounded mb-4">
        <h4 class="text-lg text-white mb-2">3. Dorso de tu DNI</h4>
        <input type="file" accept="image/*" on:change={handleKycIdBack} class="mb-2 w-full text-sm"/>
        {#if formData.kycIdBack}
            <img 
                src={formData.kycIdBack} 
                alt="Dorso DNI" 
                on:click={() => openModal(formData.kycIdBack)}
                class="h-32 mx-auto object-contain rounded cursor-pointer hover:ring-2 hover:ring-white"
            />
        {/if}
    </div>

    <Button onClick={handleMediaNext}>¡Siguiente!</Button>
{/if}

<!-- Media Preview Modal -->
<MediaModal bind:showModal bind:previewSrc bind:isVideo />