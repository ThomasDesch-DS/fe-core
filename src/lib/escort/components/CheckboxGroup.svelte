<script lang="ts">
    export let options = [];
    export let selectedValues: Set<string>;
    
    function toggleSelection(value: string) {
        selectedValues.has(value) 
            ? selectedValues.delete(value) 
            : selectedValues.add(value);
        selectedValues = selectedValues; // Trigger reactivity
    }
</script>

<div class="grid grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto text-left">
    {#each options as option}
        <label class="flex items-center space-x-2">
            <input 
                type="checkbox" 
                value={option.value}
                checked={selectedValues.has(option.value)}
                on:change={() => toggleSelection(option.value)}
                class="form-checkbox text-white bg-gray-900 border-gray-700 rounded"
            />
            <span class="text-white">{option.label}</span>
        </label>
    {/each}
</div>