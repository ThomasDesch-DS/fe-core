<script lang="ts">
  import Counter from '$lib/Counter.svelte';
</script>

<div class="flex flex-col items-center justify-center space-y-10 py-16">
  <h1 class="text-5xl font-extrabold tracking-tight">
    <span class="block">Welcome to</span> 
    <span class="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">SvelteKit</span>
  </h1>

  <p class="text-xl text-gray-400 max-w-md text-center">
    A minimalist, high-performance framework for building web applications
  </p>

  <div class="flex flex-col sm:flex-row gap-4 mt-6">
    <a 
      href="https://kit.svelte.dev" 
      class="px-6 py-3 bg-white text-black font-medium rounded-md hover:bg-gray-200 transition-colors"
      target="_blank" 
      rel="noopener noreferrer"
    >
      Documentation
    </a>
    <a 
      href="/about" 
      class="px-6 py-3 bg-transparent border border-gray-700 text-white font-medium rounded-md hover:bg-gray-900 transition-colors"
    >
      About Demo
    </a>
  </div>

  <div class="mt-12 border border-gray-800 rounded-lg p-8 bg-gray-900 w-full max-w-md">
    <h2 class="text-xl font-semibold mb-4">Try the counter</h2>
    <Counter />
  </div>

  <div class="flex flex-col items-center mt-12 space-y-4">
    <div class="text-sm text-gray-500">Built with Tailwind CSS</div>
    <div class="grid grid-cols-3 gap-3">
      <div class="h-3 w-3 rounded-full bg-white"></div>
      <div class="h-3 w-3 rounded-full bg-gray-700"></div>
      <div class="h-3 w-3 rounded-full bg-gray-500"></div>
    </div>
  </div>
</div>