<script lang="ts">
  import MarkdownRenderer from '../../lib/components/MarkdownRenderer.svelte';

  export let data;
</script>

<svelte:head>
    <title>Política de privacidad</title>
</svelte:head>

<MarkdownRenderer content={data.content} />
