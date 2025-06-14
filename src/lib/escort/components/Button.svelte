<script lang="ts">
    export let onClick: () => void;
    export let disabled = false;
</script>

<button 
    on:click={onClick} 
    disabled={disabled}
    class="w-full py-2 bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
>
    <slot></slot>
</button>