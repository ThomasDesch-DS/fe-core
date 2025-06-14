<script lang="ts">
    export let value = '';
    export let type = 'text';
    export let placeholder = '';
    export let min = '';
    export let error = '';
</script>

<input 
    {type} 
    bind:value 
    {placeholder}
    min={min || undefined}
    class="w-full px-4 py-2 bg-gray-900 text-white border {error ? 'border-red-500' : 'border-gray-700'} rounded mb-2"
/>