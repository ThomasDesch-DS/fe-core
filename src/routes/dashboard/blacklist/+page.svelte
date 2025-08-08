<!-- src/routes/blacklist/+page.svelte -->
<script lang="ts">
    // ===== Config =====
    const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? '';
    const endpoints = {
        add: `${API_BASE}/escorts/blacklist`,
        searchPhone: (user: string) => `${API_BASE}/escorts/blacklist/search/phone?user=${encodeURIComponent(user)}`,
        searchTelegram: (user: string) => `${API_BASE}/escorts/blacklist/search/telegram?user=${encodeURIComponent(user)}`
    };

    // ===== UI state =====
    let mode: 'add' | 'search' = 'add';

    // Add fields
    let wa = '';
    let tg = '';
    let reason = '';
    let description = '';
    let isSubmitting = false;
    let addMessage = '';
    let addError = '';

    // Live validation: need phone||tg AND reason
    $: canSubmit = (wa.trim() || tg.trim()) && reason.trim();

    // Search fields
    let searchType: 'phone' | 'telegram' = 'phone';
    let query = '';
    let isLoading = false;
    let searchError = '';
    let notFound = false;
    let result: null | {
        id: string;
        phone: string | null;
        telegram: string | null;
        reason: string | null;
        reports: { _id: string; reason: string; description: string | null; evidenceUrls: string[] }[];
    } = null;

    // ===== Helpers =====
    const isTelegram = (q: string) => q.trim().startsWith('@') || /^[a-zA-Z0-9_]{5,}$/.test(q.trim());
    const isPhoneish = (q: string) => !!q.trim().replace(/[^\d+]/g, '').match(/^\+?\d{6,}$/);
    const normalizePhone = (v: string) => v.trim().replace(/\s+/g, '');
    const normalizeHandle = (v: string) => v.trim().startsWith('@') ? v.trim() : `@${v.trim()}`;

    function copyToClipboard(text: string) {
        if (!text) return;
        navigator.clipboard?.writeText(text).then(() => showToast('Copiado 😉')).catch(()=>{});
    }

    let toast = '';
    let toastTimer: number | undefined;
    function showToast(msg: string) {
        toast = msg;
        clearTimeout(toastTimer as any);
        // @ts-ignore
        toastTimer = setTimeout(() => (toast = ''), 1800);
    }

    // Try to extract a useful error message from a Response
    async function extractMessage(res: Response): Promise<string> {
        try {
            const data = await res.clone().json().catch(() => null);
            if (data?.message) return String(data.message);
            if (data?.error) return String(data.error);
        } catch { /* ignore */ }
        try {
            const text = await res.clone().text();
            if (text) return text;
        } catch { /* ignore */ }
        return `HTTP ${res.status}`;
    }

    // Generic response handler (NOT for search "not found")
    async function handleResponse(res: Response): Promise<Response> {
        if (res.ok) return res;

        const msg = await extractMessage(res);

        if (res.status === 400 || res.status === 422) {
            throw new Error(msg || 'Solicitud inválida.');
        }
        if (res.status === 401) {
            throw new Error('No autorizado. Iniciá sesión primero.');
        }
        if (res.status === 403) {
            throw new Error('Acceso prohibido.');
        }
        if (res.status === 404) {
            throw new Error('No se encontró el recurso.');
        }
        throw new Error(msg || 'Error desconocido.');
    }

    // ===== Add flow =====
    async function handleAdd() {
        addMessage = '';
        addError = '';

        if (!canSubmit || isSubmitting) return;

        isSubmitting = true;
        try {
            const body = {
                phone: wa.trim() ? normalizePhone(wa) : null,
                telegram: tg.trim() ? normalizeHandle(tg) : null,
                report: {
                    reason: reason.trim(),
                    description: description.trim() ? description.trim() : null
                }
            };

            let res = await fetch(endpoints.add, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            res = await handleResponse(res);

            addMessage = '🔥 ¡Listo, ya está en la negra!';
            wa = tg = reason = description = '';
        } catch (err: any) {
            addError = `⚠️ ${err?.message || 'Algo falló'}`;
        } finally {
            isSubmitting = false;
        }
    }

    // ===== Search flow =====
    let searchAbort: AbortController | null = null;

    async function handleSearch() {
        searchError = '';
        result = null;
        notFound = false;

        const raw = query.trim();
        if (!raw) return;

        let url: string | null = null;

        if (searchType === 'telegram') {
            if (!isTelegram(raw)) {
                searchError = 'Poné un usuario de Telegram válido (ej: @usuario).';
                return;
            }
            url = endpoints.searchTelegram(normalizeHandle(raw));
        } else {
            if (!isPhoneish(raw)) {
                searchError = 'Poné un teléfono válido (ej: +54911...).';
                return;
            }
            url = endpoints.searchPhone(normalizePhone(raw));
        }

        // Abort previous
        if (searchAbort) searchAbort.abort();
        searchAbort = new AbortController();

        isLoading = true;
        try {
            let res = await fetch(url, { credentials: 'include', signal: searchAbort.signal });

            // Servers be wild: treat 404 OR 400 as "not found" for SEARCH ONLY
            if (res.status === 404 || res.status === 400) {
                notFound = true;
                return;
            }

            // For other statuses, use normal handler
            res = await handleResponse(res);

            const data = await res.json();
            result = {
                id: data.id,
                phone: data.phone ?? null,
                telegram: data.telegram ?? null,
                reason: data.reason ?? null,
                reports: Array.isArray(data.reports) ? data.reports : []
            };
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                searchError = err?.message ?? 'No pude buscar ahora mismo.';
            }
        } finally {
            isLoading = false;
        }
    }
</script>

<nav class="flex justify-around sm:justify-start gap-4 sm:gap-8 bg-black py-4 px-4 sm:px-8 border-b border-neutral-700 sticky top-0 z-10">
    <button
            class="text-lg font-semibold text-white hover:text-neutral-400 underline-offset-4 {mode==='add'?'underline':''}"
            on:click={()=>mode='add'}>Agregar a la negra</button>
    <button
            class="text-lg font-semibold text-white hover:text-neutral-400 underline-offset-4 {mode==='search'?'underline':''}"
            on:click={()=>mode='search'}>Buscar reportes</button>
</nav>

<main class="min-h-screen bg-black p-4 sm:p-6 space-y-6">
    {#if mode==='add'}
        <div class="w-full sm:max-w-xl mx-auto bg-neutral-800 rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
            <h2 class="text-2xl font-semibold text-white text-center">Meté tu WA o Telegram + motivo</h2>

            {#if addMessage}
                <p class="p-3 rounded-lg bg-emerald-900/40 text-emerald-200 text-sm text-center">{addMessage}</p>
            {/if}
            {#if addError}
                <p class="p-3 rounded-lg bg-red-900/40 text-red-200 text-sm text-center">{addError}</p>
            {/if}

            <form on:submit|preventDefault={handleAdd} class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">WhatsApp</label>
                        <input
                                type="text" bind:value={wa} placeholder="+54911..."
                                class="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Telegram</label>
                        <input
                                type="text" bind:value={tg} placeholder="@usuario"
                                class="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-1">Motivo</label>
                    <input
                            type="text" bind:value={reason} placeholder="Spam, Fake profile, No pago..."
                            class="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-1">Detalle (opcional)</label>
                    <textarea
                            bind:value={description} rows="3" placeholder="Algo más que agregar..."
                            class="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 resize-none"
                    />
                </div>

                {#if !canSubmit}
                    <p class="text-sm text-neutral-500 italic">📌 Completá: WA/Telegram + motivo</p>
                {/if}

                <button
                        type="submit"
                        class="w-full py-2 font-medium text-white bg-neutral-700 rounded-lg hover:bg-neutral-600 transition disabled:opacity-50"
                        disabled={!canSubmit || isSubmitting}
                >
                    {isSubmitting ? 'Guardando...' : 'Dale, agregalo'}
                </button>
            </form>
        </div>
    {:else}
        <div class="w-full sm:max-w-2xl mx-auto bg-neutral-800 rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
            <h2 class="text-2xl font-semibold text-white text-center">¿Está marcado?</h2>

            <!-- Type toggle -->
            <div class="flex justify-center">
                <div class="inline-flex rounded-lg overflow-hidden border border-neutral-600">
                    <button
                            type="button"
                            class="px-4 py-2 text-sm font-medium focus:outline-none
                              {searchType==='phone' ? 'bg-neutral-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}"
                            on:click={() => { searchType = 'phone'; query = ''; searchError=''; notFound=false; }}>
                        Teléfono
                    </button>
                    <button
                            type="button"
                            class="px-4 py-2 text-sm font-medium border-l border-neutral-600 focus:outline-none
                              {searchType==='telegram' ? 'bg-neutral-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}"
                            on:click={() => { searchType = 'telegram'; query = ''; searchError=''; notFound=false; }}>
                        Telegram
                    </button>
                </div>
            </div>

            {#if searchError}
                <p class="p-3 rounded-lg bg-red-900/40 text-red-200 text-sm text-center">{searchError}</p>
            {/if}

            <div class="flex flex-col sm:flex-row">
                <input
                        type="text"
                        bind:value={query}
                        placeholder={searchType==='phone' ? 'Poné WA (+549...)' : 'Poné @usuario de Telegram'}
                        on:keydown={(e)=>e.key==='Enter'&&handleSearch()}
                        class="flex-grow px-4 py-2 mb-4 sm:mb-0 sm:mr-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
                <button
                        on:click={handleSearch}
                        class="px-6 py-2 font-medium text-white bg-neutral-700 rounded-lg hover:bg-neutral-600 transition disabled:opacity-50"
                        disabled={isLoading}
                >
                    {isLoading ? 'Buscando...' : 'Buscá'}
                </button>
            </div>

            {#if isLoading}
                <div class="animate-pulse space-y-3">
                    <div class="h-4 bg-neutral-700 rounded w-1/3"></div>
                    <div class="h-16 bg-neutral-700 rounded"></div>
                </div>
            {/if}

            {#if !isLoading && result}
                <p class="text-neutral-400">Mirá lo que encontré:</p>
                <div class="space-y-4">
                    <div class="p-4 bg-neutral-700 rounded-lg border border-neutral-600">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p class="font-medium text-white">
                                    {#if result.phone}{result.phone}{/if}
                                    {#if result.phone && result.telegram} · {/if}
                                    {#if result.telegram}{result.telegram}{/if}
                                </p>
                                <p class="text-sm text-neutral-400">
                                    {result.reports.length} reporte{result.reports.length===1?'':'s'}
                                    {#if result.reason} · Motivo principal: {result.reason}{/if}
                                </p>
                            </div>
                            <div class="flex gap-2">
                                {#if result.phone}
                                    <button class="text-xs px-2 py-1 bg-neutral-800 rounded border border-neutral-600 hover:bg-neutral-700"
                                            on:click={()=>copyToClipboard(result?.phone || '')}>Copiar WA</button>
                                {/if}
                                {#if result.telegram}
                                    <button class="text-xs px-2 py-1 bg-neutral-800 rounded border border-neutral-600 hover:bg-neutral-700"
                                            on:click={()=>copyToClipboard(result?.telegram || '')}>Copiar TG</button>
                                {/if}
                            </div>
                        </div>

                        {#if result.reports.length}
                            <ul class="mt-4 divide-y divide-neutral-600">
                                {#each result.reports as r}
                                    <li class="py-3">
                                        <p class="text-white text-sm font-medium">{r.reason}</p>
                                        {#if r.description}
                                            <p class="text-neutral-300 text-sm">{r.description}</p>
                                        {/if}
                                        {#if r.evidenceUrls?.length}
                                            <div class="mt-2">
                                                <p class="text-neutral-400 text-xs mb-1">Evidencia:</p>
                                                <div class="flex flex-wrap gap-2">
                                                    {#each r.evidenceUrls as url}
                                                        <a class="text-xs underline text-neutral-200 hover:text-white break-all"
                                                           href={url} target="_blank" rel="noreferrer">Ver</a>
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                </div>
            {:else if !isLoading && !searchError && notFound}
                <p class="text-center text-neutral-400 italic">
                    El número/usuario no está blacklisteado. Todo bien 😉
                </p>
            {/if}
        </div>
    {/if}

    <!-- tiny toast -->
    {#if toast}
        <div class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-neutral-100 text-neutral-900 px-3 py-2 rounded shadow">
            {toast}
        </div>
    {/if}
</main>

<style>
    /* Small UX niceties */
    :global(input, textarea, button) { transition: all .15s ease; }
</style>
