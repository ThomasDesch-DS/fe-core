<!-- src/routes/catlist/+page.svelte -->
<script lang="ts">
    import { catlist } from "$lib/escort/store/catlistStore";
    import { onMount } from "svelte";
    import type { CatlistItem } from "$lib/escort/store/catlistStore";
    import { getMediaUrl } from "../../../util/MediaUtils";
    import { toast } from "svelte-sonner";
    import { trackPageOpen, initPosthog, trackCatlistAction } from "$lib/analytics/analytics";

    let savedCats: CatlistItem[] = [];
    onMount(() => {
        initPosthog();
        trackPageOpen({
            page: 'catlist',
            catlistSize: savedCats.length
        });
        const unsub = catlist.subscribe(v => {
            savedCats = v;
            // Track catlist size changes for analytics
            if (savedCats.length > 0) {
                trackCatlistAction({
                    action: 'catlist_updated',
                    catlistSize: savedCats.length,
                    visitedCount: savedCats.filter(c => c.visited).length
                });
            }
        });
        return () => unsub();
    });

    async function toggleVisited(item: CatlistItem) {
        trackCatlistAction({
            action: 'toggle_visited',
            escortId: item.escortId,
            escortName: item.displayName,
            fromVisited: item.visited,
            toVisited: !item.visited
        });
        
        const promise = catlist.setVisited(item.id, !item.visited);
        toast.promise(promise, {
            loading: item.visited
                ? "Quitando marca de visitada…"
                : "Marcando como visitada…",
            success: () => item.visited
                ? "Ya no está visitada 🙃"
                : "✅ Perfil marcado como visitado!",
            error: "Oops, no se actualizó 😢"
        });
    }

    function deleteCat(item: CatlistItem) {
        trackCatlistAction({
            action: 'delete_initiated',
            escortId: item.escortId,
            escortName: item.displayName,
            wasVisited: item.visited
        });
        
        // toast de confirmación con botón
        toast(`¿Eliminar a ${item.displayName}?`, {
            duration: Infinity, // queda hasta que lo toquen
            action: {
                label: 'Sí, eliminar',
                onClick: async () => {
                    trackCatlistAction({
                        action: 'delete_confirmed',
                        escortId: item.escortId,
                        escortName: item.displayName,
                        wasVisited: item.visited
                    });
                    
                    const promise = catlist.remove(item.id);
                    toast.promise(promise, {
                        loading: "Eliminando perfil…",
                        success: "🗑️ Perfil borrado de la lista!",
                        error: "No se pudo borrar 😕"
                    });
                }
            }
        });
    }
</script>

<svelte:head>
    <title>Mi Catlist</title>
    <link rel="preconnect" href={ import.meta.env.VITE_MEDIA_CDN} />
</svelte:head>


<main class="p-8 bg-black text-white">
    <h1 class="text-4xl font-bold mb-8">Mi Catlist 🐱</h1>

    {#if savedCats.length === 0}
        <p class="text-center">Aún no hay nada acá.</p>
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {#each savedCats as cat}
                <a
                        href={`/escort/${cat.slug}`}
                        class="relative block rounded-lg overflow-hidden transform hover:scale-105 transition"
                        on:click={() => trackCatlistAction({
                            action: 'view_escort',
                            escortId: cat.escortId,
                            escortName: cat.displayName,
                            wasVisited: cat.visited,
                            catlistPosition: savedCats.indexOf(cat) + 1,
                            totalCatlistSize: savedCats.length
                        })}
                >
                    <div
                            class="aspect-square bg-black"
                            class:grayscale-50={cat.visited}
                            class:opacity-70={cat.visited}
                    >
                        <img
                                src={getMediaUrl(cat.escortId, cat.profilePic, 'profile')}
                                alt={cat.displayName}
                                class="w-full h-full object-cover"
                                loading="lazy"
                        />
                    </div>

                    <!-- delete button -->
                    <button
                            on:click|preventDefault|stopPropagation={() => deleteCat(cat)}
                            class="absolute top-2 left-2 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition cursor-pointer"
                            aria-label="Eliminar de Catlist"
                            title="Eliminar de Catlist"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3"/>
                        </svg>
                    </button>

                    <!-- visited toggle -->
                    <button
                            on:click|preventDefault|stopPropagation={() => toggleVisited(cat)}
                            class="absolute top-2 right-2 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition cursor-pointer"
                            aria-label={cat.visited ? "Desmarcar visita" : "Marcar como visitada"}
                            title={cat.visited ? "Desmarcar visita" : "Marcar como visitada"}
                    >
                        {#if cat.visited}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        {/if}
                    </button>

                    <div class="p-4 bg-black border-t border-gray-700">
                        <h3 class="font-semibold text-lg">{cat.displayName}</h3>
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</main>
