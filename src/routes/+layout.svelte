<script lang="ts">
  import '../app.css';
</script>

<div class="min-h-screen bg-black text-white flex flex-col">
  <header class="border-b border-gray-800 py-4">
    <nav class="container mx-auto px-4 flex items-center justify-between">
      <div class="font-bold text-xl">App</div>
      <div class="flex space-x-6">
        <a href="/" class="hover:text-gray-300 transition-colors">Home</a>
        <a href="/about" class="hover:text-gray-300 transition-colors">About</a>
      </div>
    </nav>
  </header>
  
  <main class="flex-grow container mx-auto px-4 py-8">
    <slot />
  </main>
  
  <footer class="border-t border-gray-800 py-6">
    <div class="container mx-auto px-4 text-center text-gray-500 text-sm">
      © {new Date().getFullYear()} Vercel-inspired Demo
    </div>
  </footer>
</div>