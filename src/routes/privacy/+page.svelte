<script lang="ts">
  import MarkdownRenderer from '../../lib/components/MarkdownRenderer.svelte';

  export let data;
</script>

<MarkdownRenderer content={data.content} />
