<script lang="ts">
  import SvelteMarkdown from '@humanspeak/svelte-markdown';

  export let content: string;
</script>

<SvelteMarkdown source={content} />
