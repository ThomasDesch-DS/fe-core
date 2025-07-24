<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    // Redirect to /motels
    goto('/motels', { replaceState: true });
  });
</script>

<svelte:head>
  <title>Todos los Telos | Daisy's Secrets</title>
</svelte:head>

<main class="bg-black min-h-screen py-8 px-4">
  <div class="max-w-7xl mx-auto">
    <div class="text-center py-12">
      <h1 class="text-white text-4xl font-bold mb-4">
        🏨 Todos los Telos
      </h1>
      <p class="text-zinc-400 text-lg mb-8">
        Redirigiendo...
      </p>
    </div>
  </div>
</main>