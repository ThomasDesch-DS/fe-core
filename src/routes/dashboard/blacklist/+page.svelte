<!-- src/routes/blacklist/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';

    // ===== Config =====
    const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? '';
    const endpoints = {
        add: `${API_BASE}/escorts/blacklist`,
        searchPhone: (user: string) => `${API_BASE}/escorts/blacklist/search/phone?user=${encodeURIComponent(user)}`,
        searchTelegram: (user: string) => `${API_BASE}/escorts/blacklist/search/telegram?user=${encodeURIComponent(user)}`,
        // latest feed is paginated by page + limit
        latest: (limit = 25, page = 1) =>
            `${API_BASE}/escorts/blacklist/latest?limit=${limit}&page=${page}`
    };

    // ===== UI state =====
    let mode: 'add' | 'feed' = 'feed'; // start on Reports

    // ---- Add fields
    let wa = '';
    let tg = '';
    let reason = '';
    let description = '';
    let isSubmitting = false;
    let addMessage = '';
    let addError = '';

    // Live validation: need phone||tg AND reason
    $: canSubmit = (wa.trim() || tg.trim()) && reason.trim();

    // ---- Search (inside Reports)
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

    // ---- Latest feed
    type LatestReport = {
        _id: string;
        phone: string | null;
        telegram: string | null;
        reason: string;
        description: string | null;
        evidenceUrls: string[];
        createdAt: string | null; // ISO if your backend adds it
        reportsCount: number;
    };

    let latest: LatestReport[] = [];
    let latestLoading = false;
    let latestError = '';
    let latestHasMore = true;
    let latestPage = 0; // we will load page 1 first
    let latestTotalPages = 1;

    // prevent infinite auto-retries on first render
    let latestFirstLoadAttempted = false;

    // ===== Helpers =====
    const isTelegram = (q: string) => q.trim().startsWith('@') || /^[a-zA-Z0-9_]{5,}$/.test(q.trim());
    const isPhoneish = (q: string) => !!q.trim().replace(/[^\d+]/g, '').match(/^\+?\d{6,}$/);
    const normalizePhone = (v: string) => v.trim().replace(/\s+/g, '');
    const normalizeHandle = (v: string) => (v.trim().startsWith('@') ? v.trim() : `@${v.trim()}`);

    function copyToClipboard(text: string) {
        if (!text) return;
        navigator.clipboard?.writeText(text).then(() => showToast('Copiado 😉')).catch(() => {});
    }

    let toast = '';
    let toastTimer: number | undefined;
    function showToast(msg: string) {
        toast = msg;
        clearTimeout(toastTimer as any);
        // @ts-ignore
        toastTimer = setTimeout(() => (toast = ''), 1800);
    }

    function fmtDate(iso?: string | null) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
        } catch { return ''; }
    }

    // ===== Generic helpers =====
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

    // Finite retry with exponential backoff
    type RetryOpts = { attempts?: number; baseDelayMs?: number; signal?: AbortSignal | null; retryOn?: (res: Response) => boolean; };
    async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, opts: RetryOpts = {}) {
        const attempts = Math.max(1, opts.attempts ?? 3);
        const base = opts.baseDelayMs ?? 350;
        const retryOn = opts.retryOn ?? ((res) => res.status >= 500 || res.status === 429);
        let lastErr: any = null;

        for (let i = 0; i < attempts; i++) {
            try {
                const res = await fetch(input, { ...(init ?? {}), signal: opts.signal ?? init?.signal });
                if (!retryOn(res)) return res;
                // 429: honor Retry-After if present
                if (res.status === 429) {
                    const ra = Number(res.headers.get('Retry-After'));
                    const wait = Number.isFinite(ra) ? ra * 1000 : backoff(base, i);
                    await sleep(wait);
                    continue;
                }
                if (i < attempts - 1) {
                    await sleep(backoff(base, i));
                    continue;
                }
                return res; // let caller decide final non-ok
            } catch (err: any) {
                lastErr = err;
                if (err?.name === 'AbortError') throw err;
                if (i < attempts - 1) {
                    await sleep(backoff(base, i));
                    continue;
                }
                throw err;
            }
        }
        if (lastErr) throw lastErr;
        return await fetch(input, init);
    }
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const backoff = (base: number, i: number) => Math.min(3000, Math.round(base * Math.pow(1.8, i) + Math.random() * 120));

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

            let res = await fetchWithRetry(endpoints.add, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            }, {
                attempts: 2,
                retryOn: (r) => r.status >= 500 || r.status === 429
            });

            res = await handleResponse(res);

            addMessage = '🔥 ¡Listo, ya está en la negra!';
            wa = tg = reason = description = '';

            // optimistic refresh of latest feed
            if (mode === 'feed') {
                latest = [];
                latestPage = 0;
                latestTotalPages = 1;
                latestHasMore = true;
                latestError = '';
                void loadLatest(true);
            }
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
            let res = await fetchWithRetry(url, { credentials: 'include', signal: searchAbort.signal }, {
                attempts: 2,
                signal: searchAbort.signal,
                retryOn: (r) => r.status >= 500 || r.status === 429
            });

            // Search-specific: treat 404 OR 400 as "not found"
            if (res.status === 404 || res.status === 400) {
                notFound = true;
                return;
            }

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

    // ===== Latest feed loader (page-based, finite retries) =====
    async function loadLatest(initial = false) {
        if (latestLoading) return;
        if (!initial && !latestHasMore) return;

        latestLoading = true;
        latestError = '';

        try {
            const nextPage = initial ? 1 : latestPage + 1;

            let res = await fetchWithRetry(
                endpoints.latest(25, nextPage),
                { credentials: 'include' },
                {
                    attempts: 3,
                    retryOn: (r) => r.status >= 500 || r.status === 429
                }
            );

            if (res.status === 404) {
                latestHasMore = false;
                latest = [];
                latestError = 'Tu backend no expone /escorts/blacklist/latest todavía.';
                return;
            }

            res = await handleResponse(res);
            const data = await res.json();

            // backend shape:
            // {
            //   content: [ { id, phone, telegram, reason, reports: [ { _id, reason, description, evidenceUrls } ] } ],
            //   page: 1,
            //   totalPages: 1
            // }
            const items: any[] =
                Array.isArray(data?.content) ? data.content
                    : Array.isArray(data?.items) ? data.items
                        : Array.isArray(data?.reports) ? data.reports
                            : Array.isArray(data) ? data
                                : [];

            const mapped: LatestReport[] = items.map((x) => {
                const first = Array.isArray(x.reports) && x.reports.length ? x.reports[0] : null;
                return {
                    _id: String(x.id ?? first?._id ?? cryptoRandom()),
                    phone: x.phone ?? null,
                    telegram: x.telegram ?? null,
                    reason: x.reason ?? first?.reason ?? 'Reporte',
                    description: first?.description ?? null,
                    evidenceUrls: Array.isArray(first?.evidenceUrls) ? first!.evidenceUrls : [],
                    createdAt: x.createdAt ?? x.timestamp ?? null,
                    reportsCount: Array.isArray(x.reports) ? x.reports.length : 0
                };
            });

            latest = initial ? mapped : [...latest, ...mapped];

            latestPage = Number(data?.page ?? nextPage) || nextPage;
            latestTotalPages = Number(data?.totalPages ?? latestTotalPages) || latestTotalPages;
            latestHasMore = latestPage < latestTotalPages;
        } catch (err: any) {
            latestError = err?.message || 'No pude cargar los reportes.';
        } finally {
            latestLoading = false;
        }
    }

    function cryptoRandom() {
        try {
            // @ts-ignore
            const a = crypto.getRandomValues(new Uint32Array(2));
            return Array.from(a).map((n) => n.toString(16)).join('');
        } catch {
            return Math.random().toString(16).slice(2);
        }
    }

    // First visit: attempt once (no infinite loop if it fails)
    $: if (mode === 'feed' && !latestFirstLoadAttempted) {
        latestFirstLoadAttempted = true;
        void loadLatest(true);
    }

    // Keyboard shortcuts: "/" focuses search, Cmd/Ctrl+K toggles tabs
    let searchInputEl: HTMLInputElement | null = null;
    function onKey(e: KeyboardEvent) {
        const isMac = navigator.platform.toUpperCase().includes('MAC');
        if (e.key === '/' && mode === 'feed') {
            e.preventDefault();
            searchInputEl?.focus();
        }
        if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            mode = mode === 'add' ? 'feed' : 'add';
        }
    }
    onMount(() => {
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });
</script>

<nav class="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/90 border-b border-neutral-800">
    <div class="relative">
        <div class="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>
    </div>
    <div class="mx-auto max-w-5xl px-4 sm:px-6">
        <div class="flex items-center justify-between py-4">
            <div class="flex items-center gap-3">
                <div class="h-6 w-6 rounded-md bg-gradient-to-br from-neutral-200 to-neutral-500"></div>
                <span class="text-white font-semibold tracking-tight">Blacklist</span>
            </div>

            <div class="inline-flex p-1 rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-inner">
                <button
                        class="px-3 sm:px-4 py-1.5 text-sm rounded-lg font-medium transition
                           focus:outline-none focus-visible:ring focus-visible:ring-neutral-600
                           {mode==='add' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}"
                        on:click={() => (mode = 'add')}
                >
                    Agregar
                </button>
                <button
                        class="px-3 sm:px-4 py-1.5 text-sm rounded-lg font-medium transition
                           focus:outline-none focus-visible:ring focus-visible:ring-neutral-600
                           {mode==='feed' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}"
                        on:click={() => (mode = 'feed')}
                >
                    Reportes
                </button>
            </div>
        </div>
    </div>
</nav>

<main class="min-h-screen bg-black">
    <div class="mx-auto max-w-5xl p-4 sm:p-6 space-y-8">

        {#if mode==='add'}
            <section class="relative">
                <div class="absolute -inset-px rounded-3xl bg-gradient-to-b from-neutral-800 to-transparent opacity-60"></div>
                <div class="relative w-full sm:max-w-2xl mx-auto bg-neutral-900/60 rounded-3xl border border-neutral-800 shadow-xl p-6 sm:p-8 space-y-6">
                    <h2 class="text-2xl font-semibold text-white text-center">Meté tu WA o Telegram + motivo</h2>

                    {#if addMessage}
                        <p class="p-3 rounded-lg bg-emerald-900/40 text-emerald-200 text-sm text-center">{addMessage}</p>
                    {/if}
                    {#if addError}
                        <p class="p-3 rounded-lg bg-red-900/40 text-red-200 text-sm text-center">{addError}</p>
                    {/if}

                    <form on:submit|preventDefault={handleAdd} class="space-y-5">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-neutral-300 mb-1">WhatsApp</label>
                                <input
                                        type="text" bind:value={wa} placeholder="+54911..."
                                        class="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-neutral-300 mb-1">Telegram</label>
                                <input
                                        type="text" bind:value={tg} placeholder="@usuario"
                                        class="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-1">Motivo</label>
                            <input
                                    type="text" bind:value={reason} placeholder="Spam, Fake profile, No pago..."
                                    class="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-1">Detalle (opcional)</label>
                            <textarea
                                    bind:value={description} rows="3" placeholder="Algo más que agregar..."
                                    class="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 resize-none"
                            />
                        </div>

                        <div class="flex items-center justify-between">
                            {#if !canSubmit}
                                <p class="text-sm text-neutral-500 italic">📌 Completá: WA/Telegram + motivo</p>
                            {:else}
                                <span class="text-sm text-neutral-500">Todo listo.</span>
                            {/if}

                            <button
                                    type="submit"
                                    class="inline-flex items-center gap-2 px-5 py-2.5 font-medium text-white rounded-xl
                                       bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500
                                       focus:outline-none focus-visible:ring focus-visible:ring-neutral-600 transition disabled:opacity-50"
                                    disabled={!canSubmit || isSubmitting}
                            >
                                {#if isSubmitting}
                                    <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle><path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-linecap="round"></path></svg>
                                    Guardando...
                                {:else}
                                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Dale, agregalo
                                {/if}
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        {:else}
            <!-- FEED + CTA + SEARCH -->
            <section class="space-y-6">
                <!-- CTA: encourage adding a report -->
                <div class="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-black">
                    <div class="pointer-events-none absolute -inset-1 opacity-60 [mask-image:radial-gradient(black,transparent_60%)]">
                        <div class="absolute -top-32 -right-24 h-64 w-64 rounded-full bg-gradient-to-tr from-neutral-700/30 to-transparent blur-2xl"></div>
                        <div class="absolute -bottom-40 -left-20 h-72 w-72 rounded-full bg-gradient-to-tr from-neutral-600/20 to-transparent blur-2xl"></div>
                    </div>
                    <div class="relative p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 class="text-white text-lg sm:text-xl font-semibold">¿Tenés un reporte? Sumalo en 30s.</h3>
                            <p class="text-neutral-400 text-sm">Ayudá a la comunidad: agregá teléfono o @ de Telegram + motivo.</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                    class="inline-flex items-center gap-2 px-4 py-2.5 font-medium text-white rounded-xl
                                       bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500
                                       border border-neutral-800 focus:outline-none focus-visible:ring focus-visible:ring-neutral-600"
                                    on:click={() => (mode = 'add')}
                            >
                                Agregar nuevo reporte
                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Search bar -->
                <div class="w-full mx-auto bg-neutral-900/60 rounded-2xl border border-neutral-800 shadow-xl p-4 sm:p-5">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                        <div class="inline-flex rounded-lg overflow-hidden border border-neutral-800 mb-3 sm:mb-0">
                            <button
                                    type="button"
                                    class="px-3 py-1.5 text-xs sm:text-sm font-medium
                                       {searchType==='phone' ? 'bg-neutral-700 text-white' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'}"
                                    on:click={() => { searchType = 'phone'; query = ''; searchError=''; notFound=false; }}>
                                Teléfono
                            </button>
                            <button
                                    type="button"
                                    class="px-3 py-1.5 text-xs sm:text-sm font-medium border-l border-neutral-800
                                       {searchType==='telegram' ? 'bg-neutral-700 text-white' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'}"
                                    on:click={() => { searchType = 'telegram'; query = ''; searchError=''; notFound=false; }}>
                                Telegram
                            </button>
                        </div>

                        <div class="flex flex-1 items-center">
                            <div class="relative flex-1">
                                <input
                                        bind:this={searchInputEl}
                                        type="text"
                                        bind:value={query}
                                        placeholder={searchType==='phone' ? 'Buscar WA (+549...)' : 'Buscar @usuario de Telegram'}
                                        on:keydown={(e)=>e.key==='Enter'&&handleSearch()}
                                        class="w-full px-4 py-2.5 pl-10 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                                />
                                <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" viewBox="0 0 24 24" fill="none">
                                    <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"></circle>
                                    <path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                                </svg>
                                <span class="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 border border-neutral-700 rounded px-1.5 py-0.5">/</span>
                            </div>
                            <button
                                    on:click={handleSearch}
                                    class="ml-2 inline-flex items-center gap-2 px-4 py-2.5 font-medium text-white rounded-xl
                                       bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500
                                       focus:outline-none focus-visible:ring focus-visible:ring-neutral-600 transition disabled:opacity-50"
                                    disabled={isLoading}
                            >
                                {#if isLoading}
                                    <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle><path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-linecap="round"></path></svg>
                                    Buscando...
                                {:else}
                                    Buscar
                                {/if}
                            </button>
                        </div>
                    </div>

                    {#if searchError}
                        <p class="mt-3 p-3 rounded-lg bg-red-900/40 text-red-200 text-sm text-center">{searchError}</p>
                    {/if}

                    {#if isLoading}
                        <div class="mt-4 animate-pulse space-y-3">
                            <div class="h-4 bg-neutral-800 rounded w-1/3"></div>
                            <div class="h-20 bg-neutral-800 rounded"></div>
                        </div>
                    {/if}

                    {#if !isLoading && result}
                        <div class="mt-4 space-y-3">
                            <p class="text-neutral-400 text-sm">Resultado:</p>
                            <div class="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
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
                                            <button class="text-xs px-2 py-1.5 bg-neutral-950 rounded border border-neutral-800 hover:bg-neutral-800"
                                                    on:click={()=>copyToClipboard(result?.phone || '')}>Copiar WA</button>
                                        {/if}
                                        {#if result.telegram}
                                            <button class="text-xs px-2 py-1.5 bg-neutral-950 rounded border border-neutral-800 hover:bg-neutral-800"
                                                    on:click={()=>copyToClipboard(result?.telegram || '')}>Copiar TG</button>
                                        {/if}
                                    </div>
                                </div>

                                {#if result.reports.length}
                                    <ul class="mt-4 divide-y divide-neutral-800">
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
                        <p class="mt-4 text-center text-neutral-400 italic">El número/usuario no está blacklisteado. Todo bien 😉</p>
                    {/if}
                </div>

                <!-- Latest reports feed -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-white">Últimos reportes</h3>
                        <div class="flex items-center gap-2">
                            <button
                                    class="text-sm px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200"
                                    on:click={() => {
                                    latest = [];
                                    latestPage = 0;
                                    latestTotalPages = 1;
                                    latestHasMore = true;
                                    latestError = '';
                                    void loadLatest(true);
                                }}
                                    disabled={latestLoading}
                            >
                                {latestLoading ? 'Actualizando...' : 'Actualizar'}
                            </button>
                        </div>
                    </div>

                    {#if latestError}
                        <div class="p-4 rounded-xl border border-red-900/40 bg-red-900/20">
                            <p class="text-red-200 text-sm text-center">{latestError}</p>
                            <div class="mt-3 flex justify-center">
                                <button
                                        class="text-sm px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200"
                                        on:click={() => { latestError=''; void loadLatest(true); }}
                                        disabled={latestLoading}
                                >
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    {/if}

                    {#if latestLoading && latest.length === 0 && !latestError}
                        <!-- skeletons -->
                        <div class="space-y-3">
                            {#each Array(5) as _}
                                <div class="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 animate-pulse">
                                    <div class="flex justify-between">
                                        <div class="h-4 w-40 bg-neutral-800 rounded"></div>
                                        <div class="h-4 w-24 bg-neutral-800 rounded"></div>
                                    </div>
                                    <div class="mt-3 h-4 w-64 bg-neutral-800 rounded"></div>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    {#if !latestLoading && latest.length === 0 && !latestError}
                        <p class="text-center text-neutral-500">No hay reportes recientes.</p>
                    {/if}

                    <ul class="space-y-3">
                        {#each latest as item}
                            <li class="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 hover:border-neutral-700 transition">
                                <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0">
                                        <div class="flex flex-wrap items-center gap-2 text-sm">
                                            {#if item.phone}
                                                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-200">
                                                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>
                                                    {item.phone}
                                                </span>
                                            {/if}
                                            {#if item.telegram}
            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-200">
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M21 3L9 14l-1 7 5-4 8-14z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
                {item.telegram}
            </span>
                                            {/if}
                                            {#if item.reportsCount > 0}
                                                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
                                                    {item.reportsCount} reporte{item.reportsCount===1?'':'s'}
                                                </span>
                                            {/if}
                                        </div>
                                        <p class="mt-2 text-sm text-white font-medium">{item.reason}</p>
                                        {#if item.description}
                                            <p class="mt-1 text-sm text-neutral-300">{item.description}</p>
                                        {/if}
                                        {#if item.evidenceUrls?.length}
                                            <div class="mt-2">
                                                <p class="text-neutral-400 text-xs mb-1">Evidencia:</p>
                                                <div class="flex flex-wrap gap-2">
                                                    {#each item.evidenceUrls as url}
                                                        <a class="text-xs underline text-neutral-200 hover:text-white break-all"
                                                           href={url} target="_blank" rel="noreferrer">Ver</a>
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="flex flex-col items-end gap-2 shrink-0">
                                        {#if item.createdAt}
                                            <span class="text-xs text-neutral-500">{fmtDate(item.createdAt)}</span>
                                        {/if}
                                        <div class="flex items-center gap-2">
                                            {#if item.phone}
                                                <button class="text-xs px-2 py-1.5 bg-neutral-950 rounded border border-neutral-800 hover:bg-neutral-800"
                                                        on:click={()=>copyToClipboard(item.phone || '')}>Copiar WA</button>
                                            {/if}
                                            {#if item.telegram}
                                                <button class="text-xs px-2 py-1.5 bg-neutral-950 rounded border border-neutral-800 hover:bg-neutral-800"
                                                        on:click={()=>copyToClipboard(item.telegram || '')}>Copiar TG</button>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        {/each}
                    </ul>

                    {#if latestHasMore}
                        <div class="pt-2">
                            <button
                                    class="w-full py-2.5 text-sm font-medium text-white rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60"
                                    on:click={() => loadLatest(false)}
                                    disabled={latestLoading}
                            >
                                {latestLoading ? 'Cargando...' : 'Cargar más'}
                            </button>
                        </div>
                    {/if}
                </div>
            </section>
        {/if}

        <!-- tiny toast -->
        {#if toast}
            <div class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-neutral-100 text-neutral-900 px-3 py-2 rounded shadow">
                {toast}
            </div>
        {/if}
    </div>
</main>

<style>
    /* Small UX niceties */
    :global(input, textarea, button) { transition: all .15s ease; }
    :global(.shadow-inner) { box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.02); }
</style>
