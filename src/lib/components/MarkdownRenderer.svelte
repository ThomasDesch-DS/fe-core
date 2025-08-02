<script lang="ts">
  import { marked } from 'marked';

  export let content: string;
</script>

{#if content}
  {@html marked(content)}
{/if}