<script lang="ts">
    import { focusNextOnEnter } from '../utils/formUtils';
    export let onClick: (() => void) | undefined = undefined;
    export let disabled = false;
    export let type: 'button' | 'submit' | 'reset' = 'button';
</script>

<button 
    use:focusNextOnEnter
    on:click={onClick} 
    {type}
    {disabled}
    class="w-full py-2 bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
>
    <slot></slot>
</button>