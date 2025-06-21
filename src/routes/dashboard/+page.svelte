<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    import { authStore } from '$lib/escort/store/authStore';
    import { logout } from '$lib/escort/api/authApi';
    import { goto } from '$app/navigation';
    import { onDestroy } from 'svelte';

    let activeTab = 'Perfil';
    const tabs = ['Perfil', 'Media', 'Servicios', 'Disponibilidad', 'Contacto'];

    let authState;
    const unsubscribe = authStore.subscribe(state => {
        authState = state;
    });
    onDestroy(unsubscribe);

    $: escort = authState.user?.profile || null;

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

    function getMediaUrl(escortId: string, fileName: string, type: 'profile' | 'pics'): string {
        return `https://nexus.daisyssecrets.com/escorts/${escortId}/${type}/${fileName}`;
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
                    <h1 class="text-3xl font-bold">¡Bienvenida, {escort.displayName}!</h1>
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
                <div class="card">
                    <h2 class="text-xl font-semibold mb-2">Descripción</h2>
                    <p class="text-gray-400 leading-relaxed">{escort.description}</p>
                </div>
                <div class="card">
                    <h2 class="text-xl font-semibold mb-2">Info Básica</h2>
                    <ul class="space-y-1 text-gray-400">
                        <li><strong class="text-white">Nombre:</strong> {escort.basicInfo.name} {escort.basicInfo.surname}</li>
                        <li><strong class="text-white">Edad:</strong> {escort.basicInfo.age} años</li>
                        <li><strong class="text-white">Documento:</strong> {escort.basicInfo.documentation}</li>
                    </ul>
                </div>
                <div class="card">
                    <h2 class="text-xl font-semibold mb-2">Apariencia</h2>
                    <ul class="space-y-1 text-gray-400">
                        <li><strong class="text-white">Altura:</strong> {escort.appearance.heightInCm} cm</li>
                        <li><strong class="text-white">Peso:</strong> {escort.appearance.weightInKg} kg</li>
                        <li><strong class="text-white">Cabello:</strong> {escort.appearance.hairColor}</li>
                        <li><strong class="text-white">Ojos:</strong> {escort.appearance.eyeColor}</li>
                        <li><strong class="text-white">Métricas:</strong> {escort.appearance.bust}/{escort.appearance.waist}/{escort.appearance.hips} cm</li>
                    </ul>
                </div>
                <div class="card">
                    <h2 class="text-xl font-semibold mb-2">Contacto</h2>
                    {#each escort.contactMethod as c}
                        <p class="text-gray-400"><strong class="text-white">{c.type}:</strong> {c.value}</p>
                    {/each}
                </div>
            </section>
        {/if}

        {#if activeTab === 'Media'}
            <section class="space-y-6" transition:fade>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {#each escort.media.pics as pic}
                        <img
                                src={getMediaUrl(escort.id, pic.media, 'pics')}
                                alt="Foto {pic.order}"
                                class="rounded-lg hover:opacity-90 transition-opacity"
                        />
                    {/each}
                </div>
                {#if escort.media.videos.length}
                    <video
                            src={getMediaUrl(escort.id, escort.media.videos[0].media, 'pics')}
                            controls
                            class="w-full rounded-lg hover:opacity-90 transition-opacity"
                    ></video>
                {/if}
            </section>
        {/if}

        {#if activeTab === 'Servicios'}
            <section transition:fade>
                <h2 class="text-xl font-semibold mb-4">Servicios & Fantasías</h2>
                <div class="flex flex-wrap gap-2">
                    {#each [...escort.servicesInfo.escortServices, ...escort.servicesInfo.escortFantasies, ...escort.servicesInfo.massageType, ...escort.servicesInfo.virtualServices] as service}
                        <span class="badge">{service.replace(/_/g, ' ')}</span>
                    {/each}
                </div>
                <p class="mt-4 text-gray-400"><strong class="text-white">Precio por hora:</strong> {escort.servicesInfo.hourPrice.amount} {escort.servicesInfo.hourPrice.currency}</p>
            </section>
        {/if}

        {#if activeTab === 'Disponibilidad'}
            <section class="grid grid-cols-2 sm:grid-cols-4 gap-4" transition:fade>
                {#each escort.availability.schedule as day}
                    <div class="card text-center">
                        <p class="font-semibold text-white">{day.day}</p>
                        <p class="text-gray-400">{day.slots[0].startHourWithMinutes}</p>
                    </div>
                {/each}
            </section>
        {/if}

        {#if activeTab === 'Contacto'}
            <section class="card max-w-md mx-auto text-center" transition:scale={{ duration: 100 }}>
                <h2 class="text-xl font-semibold mb-2">Contacto Directo</h2>
                {#each escort.contactMethod as c}
                    <p class="text-gray-400"><strong class="text-white">{c.type}:</strong> {c.value}</p>
                {/each}
            </section>
        {/if}
    </div>
{/if}
