<script lang="ts">
  import MarkdownRenderer from '../../lib/components/MarkdownRenderer.svelte';

  export let data;
</script>

<svelte:head>
    <title>Términos y condiciones</title>
</svelte:head>


<MarkdownRenderer content={data.content} />
