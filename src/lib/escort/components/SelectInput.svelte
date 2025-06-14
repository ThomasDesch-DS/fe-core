<script lang="ts">
    export let value = '';
    export let options = [];
    export let placeholder = 'Select an option';
</script>

<select 
    bind:value
    class="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded mb-4"
>
    <option value="" disabled selected hidden>{placeholder}</option>
    {#each options as option}
        <option value={option.value}>{option.label}</option>
    {/each}
</select>