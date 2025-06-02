<script lang="ts">
  let count: number = $state(0)
  const increment = () => {
    count += 1
  }
  const decrement = () => {
    if (count > 0) count -= 1
  }
</script>

<div class="flex flex-col items-center w-full">
  <div class="text-4xl font-bold mb-4">{count}</div>
  
  <div class="flex gap-2 w-full">
    <button 
      onclick={decrement}
      class="flex-1 bg-transparent hover:bg-gray-800 text-white border border-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
      disabled={count === 0}
    >
      -
    </button>
    
    <button 
      onclick={increment}
      class="flex-1 bg-white hover:bg-gray-200 text-black font-medium py-2 px-4 rounded-md transition-colors"
    >
      +
    </button>
  </div>
</div>
