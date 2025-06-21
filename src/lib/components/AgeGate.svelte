<script lang="ts">
  import { ageStore } from '../store/ageStore';
  
  function handleYes() {
    ageStore.checkAge(true);
  }
  
  function handleNo() {
    ageStore.checkAge(false);
  }
</script>

<div class="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
  <div class="max-w-md w-full text-center">
    <h1 class="text-2xl font-bold text-white mb-6">¿Tenés más de 18 años?</h1>
    <p class="text-gray-300 mb-8">Esta app contiene contenido exclusivo para adultos.</p>
    
    <div class="flex flex-col sm:flex-row justify-center gap-4">
      <button 
        on:click={handleYes}
        class="bg-white text-black font-medium py-2 px-6 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors"
      >
        Sí, tengo más de 18
      </button>
      
      <button 
        on:click={handleNo}
        class="bg-gray-600 text-gray-200 font-medium py-2 px-6 rounded-md hover:bg-gray-700 active:bg-gray-800 transition-colors"
      >
        No, soy menor
      </button>
    </div>
  </div>
</div>
