<script lang="ts">
  import Counter from './lib/Counter.svelte'
</script>

<main class="min-h-screen bg-black flex flex-col items-center justify-center p-4">
  <div class="w-full max-w-3xl">
    <div class="border border-white p-8 mb-8">
      <h1 class="text-4xl font-bold text-white mb-6">Black & White UI</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-white text-black p-6">
          <h2 class="text-2xl font-bold mb-4">White Box</h2>
          <p class="mb-4">This box has white background and black text.</p>
          <Counter />
        </div>
        
        <div class="bg-black text-white border border-white p-6">
          <h2 class="text-2xl font-bold mb-4">Black Box</h2>
          <p class="mb-4">This box has black background and white text.</p>
          <button class="bg-white text-black font-bold py-2 px-4 hover:bg-gray-200">
            White Button
          </button>
        </div>
      </div>
      
      <div class="flex justify-between items-center">
        <p class="text-white">Tailwind CSS is working!</p>
        <a href="/" class="text-white underline hover:no-underline">Link Example</a>
      </div>
    </div>
  </div>
</main>

