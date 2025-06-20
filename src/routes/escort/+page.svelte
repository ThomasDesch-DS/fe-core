<!-- src/routes/escort/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    // This is a landing page for the escort profiles section
    // Will redirect to a sample profile or show a list of escorts
    
    onMount(() => {
        // In a real app, this could show a list of escorts or featured profiles
        // For now, we'll simulate a redirect to a profile
        goto('/escort/luna');
    });
</script>

<div class="flex justify-center items-center h-screen">
    <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p class="text-gray-400">Loading escorts...</p>
    </div>
</div>