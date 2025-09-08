<script lang="ts">
  export let options: { value: string; label: string }[] = [];
  export let selectedValues: Set<string>;

  let q = '';

  function toggle(value: string) {
    if (selectedValues.has(value)) selectedValues.delete(value);
    else selectedValues.add(value);
    // reassign to trigger reactivity in parent
    selectedValues = new Set(selectedValues);
  }

  function handleKey(e: KeyboardEvent, value: string) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle(value);
    }
  }

  const filtered = () =>
    options.filter(o =>
      o.label.toLowerCase().includes(q.trim().toLowerCase())
    );

  function selectAll() {
    const all = new Set(selectedValues);
    filtered().forEach(o => all.add(o.value));
    selectedValues = all;
  }

  function clearAll() {
    const rest = new Set(selectedValues);
    filtered().forEach(o => rest.delete(o.value));
    selectedValues = rest;
  }
</script>

<!-- Wrapper: Vercel-style center + max width -->
<div class="w-full">
  <!-- Controls -->
  <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <input
      type="text"
      bind:value={q}
      placeholder="Buscar…"
      class="w-full md:w-1/2 rounded-xl bg-neutral-900/70 border border-neutral-800 px-4 py-2 text-neutral-200 placeholder-neutral-500 outline-none focus:border-neutral-700 focus:ring-2 focus:ring-white/10 transition"
    />

    <div class="flex gap-2">
      <button
        type="button"
        class="rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900 focus:ring-2 focus:ring-white/10 transition"
        on:click={selectAll}
      >
        Seleccionar todo
      </button>
      <button
        type="button"
        class="rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 focus:ring-2 focus:ring-white/10 transition"
        on:click={clearAll}
      >
        Limpiar
      </button>
    </div>
  </div>

  <!-- Chips grid: no inner scroll, page handles overflow -->
  <div
    class="grid gap-3
           [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]"
  >
    {#each filtered() as opt}
      <!-- Accessible “chip” that acts like a checkbox -->
      <div
        role="checkbox"
        aria-checked={selectedValues.has(opt.value)}
        tabindex="0"
        on:keydown={(e) => handleKey(e, opt.value)}
        on:click={() => toggle(opt.value)}
        class="group relative rounded-2xl border
               px-4 py-3 cursor-pointer select-none
               border-neutral-800 bg-neutral-900/60
               text-neutral-200
               hover:border-neutral-700 hover:bg-neutral-900/80
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/10
               transition"
      >
        <div class="flex items-center gap-3">
          <span
            class="flex h-5 w-5 items-center justify-center rounded-md border
                   border-neutral-700
                   group-aria-[checked=true]:bg-white
                   group-aria-[checked=true]:border-white
                   transition"
          >
            <!-- checkmark -->
            <svg
              class="h-3.5 w-3.5 opacity-0 group-aria-[checked=true]:opacity-100 transition"
              viewBox="0 0 20 20" fill="currentColor"
            >
              <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.4 7.4a1 1 0 0 1-1.4 0L3.3 9.5a1 1 0 1 1 1.4-1.4l3.3 3.3 6.7-6.7a1 1 0 0 1 1.4 0z"/>
            </svg>
          </span>
          <span class="text-sm md:text-[15px]">{opt.label}</span>
        </div>
      </div>
    {/each}
  </div>

  {#if filtered().length === 0}
    <div class="mt-6 text-center text-neutral-400 text-sm">
      Nada por acá. Probá con otro término.
    </div>
  {/if}
</div>

<style>
  /* Enable the fancy aria selector (for older Tailwind versions) */
  .group[aria-checked="true"] .group-aria-\[checked\=true\]\:bg-white { }
  .group[aria-checked="true"] .group-aria-\[checked\=true\]\:border-white { }
  .group[aria-checked="true"] .group-aria-\[checked\=true\]\:opacity-100 { }
</style>