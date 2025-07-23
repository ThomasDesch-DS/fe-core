<script lang="ts">
    import { focusNextOnEnter } from '../utils/formUtils';
    export let value = '';
    export let type = 'text';
    export let placeholder = '';
    export let min = '';
    export let error = '';
    export let autofocus = false;
</script>

<input 
    use:focusNextOnEnter
    {type} 
    bind:value 
    {placeholder}
    min={min || undefined}
    {autofocus}
    class="w-full px-4 py-2 bg-gray-900 text-white border {error ? 'border-red-500' : 'border-gray-700'} rounded mb-2"
/>