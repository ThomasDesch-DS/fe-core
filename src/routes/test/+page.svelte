<script lang="ts">
    import { onMount } from 'svelte';


    export function htmlBind(node: HTMLElement, html: string) { node.innerHTML = html; return { update(v: string) { node.innerHTML = v; } }; }

    // ---------------- Types
    type Vote = -1 | 0 | 1;
    type PostKind = 'text' | 'image' | 'link' | 'poll';

    type Comment = {
        id: string;
        author: string;
        body: string;
        createdAt: string;
        votes: number;
        userVote: Vote;
        children?: Comment[];
        collapsed?: boolean;
    };

    type Post = {
        id: string;
        community: string;
        author: string;
        title: string;
        kind: PostKind;
        body?: string;           // markdown-lite for text/link desc
        images?: string[];       // for image posts
        linkUrl?: string;        // for link preview
        poll?: { options: { id: string; label: string; votes: number }[]; total: number; votedId?: string };
        createdAt: string;       // ISO
        votes: number;
        userVote: Vote;
        comments: number;
        saved?: boolean;
        awards?: { name: string; count: number }[];
        thread?: Comment[];      // mock thread when expanded
    };

    // ---------------- State
    let search = '';
    let sort: 'hot' | 'new' | 'top' = 'hot';
    let showComposer = false;
    let showNotifications = false;
    let showInbox = false;
    let showShortcuts = false;

    let loadingMore = false;
    let hasMore = true;

    let density: 'cozy' | 'compact' = 'cozy';

    let newPost = {
        community: 'sveltekit',
        title: '',
        kind: 'text' as PostKind,
        body: ''
    };

    // --------------- Mock data
    const avatar = (seed: string) => `https://api.dicebear.com/8.x/shapes/svg?scale=90&seed=${seed}&backgroundType=gradientLinear`;

    let posts: Post[] = [
        {
            id: '1',
            community: 'sveltekit',
            author: 'midstack',
            title: "Show & Tell: Migrated from Next → SvelteKit — TTFB ↓ 40%",
            kind: 'text',
            body: "Kept the vercel-ish DX, but routing got simpler. **AMA** about pitfalls. Code sample: `handle: ({ event, resolve }) => resolve(event)`.",
            createdAt: isoMinutesAgo(32),
            votes: 324, userVote: 0, comments: 58, saved: false,
            awards: [{ name: 'Star', count: 2 }, { name: 'Helpful', count: 1 }]
        },
        {
            id: '2',
            community: 'tailwindcss',
            author: 'ux-salty',
            title: "Critique my no-color focus strategy",
            kind: 'image',
            images: [
                'https://picsum.photos/seed/tw1/800/500',
                'https://picsum.photos/seed/tw2/800/500',
                'https://picsum.photos/seed/tw3/800/500'
            ],
            body: "Only neutrals. Using ring-neutral + underline on hover. Thoughts?",
            createdAt: isoHoursAgo(4),
            votes: 212, userVote: 1, comments: 37, saved: true
        },
        {
            id: '3',
            community: 'devops',
            author: 'infra-girl',
            title: "CI tip: smoke on PR, full on schedule",
            kind: 'link',
            linkUrl: "https://example.com/blog/ci-strategy",
            body: "Pipeline time cut by ~60%. Also preview envs per PR. *Minimal* flake.",
            createdAt: isoHoursAgo(22),
            votes: 511, userVote: 0, comments: 91
        },
        {
            id: '4',
            community: 'product',
            author: 'pollster',
            title: "Poll: best neutral focus indicator?",
            kind: 'poll',
            poll: {
                options: [
                    { id: 'a', label: '1px ring-neutral-600', votes: 62 },
                    { id: 'b', label: 'Underline on focus', votes: 41 },
                    { id: 'c', label: 'Inset shadow', votes: 23 },
                    { id: 'd', label: 'Dotted outline', votes: 7 }
                ],
                total: 62 + 41 + 23 + 7
            },
            createdAt: isoMinutesAgo(10),
            votes: 47, userVote: 0, comments: 12
        }
    ];

    const leftNav = [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'all', label: 'All', icon: 'grid' },
        { id: 'popular', label: 'Popular', icon: 'fire' },
        { id: 'saved', label: 'Saved', icon: 'bookmark' }
    ];

    const trends = [
        { tag: 'sveltekit', posts: '2.1k' },
        { tag: 'tailwindcss', posts: '6.3k' },
        { tag: 'devops', posts: '5.4k' },
        { tag: 'privacy', posts: '1.8k' }
    ];

    const topCommunities = [
        { name: 'sveltekit', members: '142k' },
        { name: 'tailwindcss', members: '398k' },
        { name: 'devops', members: '1.2M' },
        { name: 'javascript', members: '3.3M' }
    ];

    const whoToFollow = [
        { user: 'vercel-ghost', bio: 'ships at night', avatar: avatar('vercel') },
        { user: 'svelte-labs', bio: 'routings & stores', avatar: avatar('svelte') },
        { user: 'infra-girl', bio: 'ops but cute', avatar: avatar('infra') },
    ];

    const notifications = [
        { id: 'n1', text: 'u/infra-girl replied to your comment', time: '7m' },
        { id: 'n2', text: 'New mod note in r/sveltekit', time: '1h' },
        { id: 'n3', text: 'Your post hit 500 upvotes', time: '1d' },
    ];

    const inbox = [
        { id: 'm1', from: 'midstack', preview: 'that TTFB drop is clean', time: '12m' },
        { id: 'm2', from: 'ux-salty', preview: 'focus rings → keyboard users', time: '2h' },
    ];

    // --------------- Helpers
    function isoMinutesAgo(m: number) { return new Date(Date.now() - m * 60000).toISOString(); }
    function isoHoursAgo(h: number) { return isoMinutesAgo(h * 60); }

    const timeAgo = (iso: string) => {
        const ms = Date.now() - new Date(iso).getTime();
        const m = Math.floor(ms / 60000);
        if (m < 1) return 'now';
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h`;
        const d = Math.floor(h / 24);
        return `${d}d`;
    };

    const setSort = (s: typeof sort) => (sort = s);

    const sortedPosts = () => {
        const arr = [...posts];
        if (sort === 'new') return arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        if (sort === 'top') return arr.sort((a, b) => b.votes - a.votes);
        return arr.sort(
            (a, b) =>
                (b.votes + Math.max(0, 500 - (Date.now() - +new Date(b.createdAt)) / 60000)) -
                (a.votes + Math.max(0, 500 - (Date.now() - +new Date(a.createdAt)) / 60000))
        );
    };

    const toggleSave = (p: Post) => (p.saved = !p.saved);

    function vote(p: Post, dir: Vote) {
        if (p.userVote === dir) { p.votes -= dir; p.userVote = 0; }
        else { p.votes += dir - p.userVote; p.userVote = dir; }
    }

    function voteComment(c: Comment, dir: Vote) {
        if (c.userVote === dir) { c.votes -= dir; c.userVote = 0; }
        else { c.votes += dir - c.userVote; c.userVote = dir; }
    }

    function submitPost() {
        if (!newPost.title.trim()) return toast('Title required');
        const p: Post = {
            id: (Math.random() + '').slice(2),
            community: newPost.community,
            author: 'you',
            title: newPost.title.trim(),
            kind: newPost.kind,
            body: newPost.body?.trim(),
            images: newPost.kind === 'image' ? ['https://picsum.photos/seed/new1/900/600'] : undefined,
            linkUrl: newPost.kind === 'link' ? 'https://example.com' : undefined,
            poll: newPost.kind === 'poll' ? { options: [
                    { id: 'x', label: 'Neutral ring', votes: 1 },
                    { id: 'y', label: 'Underline', votes: 0 }
                ], total: 1 } : undefined,
            createdAt: new Date().toISOString(),
            votes: 1, userVote: 1, comments: 0
        };
        posts = [p, ...posts];
        newPost = { community: newPost.community, title: '', kind: 'text', body: '' };
        showComposer = false;
        toast('Posted');
    }

    function openThread(p: Post) {
        if (p.thread) return;
        // mock load
        p.thread = [
            mkComment('c1', 'infra-girl', "Nice win. Did you tweak **edge** cache?", 14, [
                mkComment('c1-1', 'midstack', "Yep. `s-maxage=60`, stale-while-revalidate.", 5)
            ]),
            mkComment('c2', 'ux-salty', "Focus style is 🔑. Avoid *blue* defaults.", 9),
        ];
    }
    function mkComment(id: string, author: string, body: string, votesN: number, children: Comment[] = []): Comment {
        return { id, author, body, createdAt: isoMinutesAgo(30), votes: votesN, userVote: 0, children };
    }

    function toggleCollapse(c: Comment) { c.collapsed = !c.collapsed; }

    function castVote(p: Post, optionId: string) {
        if (!p.poll) return;
        if (p.poll.votedId) return toast('You already voted');
        const opt = p.poll.options.find(o => o.id === optionId);
        if (!opt) return;
        opt.votes += 1;
        p.poll.total += 1;
        p.poll.votedId = optionId;
    }

    // --------------- Toasts
    type Toast = { id: string; text: string };
    let toasts: Toast[] = [];
    function toast(text: string) {
        const t = { id: Math.random().toString(36).slice(2), text };
        toasts = [t, ...toasts];
        setTimeout(() => { toasts = toasts.filter(x => x.id !== t.id); }, 2200);
    }

    // --------------- Keyboard shortcuts
    let searchEl: HTMLInputElement | null = null;
    const handleKeys = (e: KeyboardEvent) => {
        if (e.key === '/' && !(document.activeElement as HTMLElement)?.closest('input,textarea')) { e.preventDefault(); searchEl?.focus(); }
        if (e.key.toLowerCase() === 'c' && !(document.activeElement as HTMLElement)?.closest('input,textarea')) { e.preventDefault(); showComposer = true; }
        if ((e.key.toLowerCase() === 'g')) { (window as any).__g = true; }
        if ((e.key.toLowerCase() === 'h') && (window as any).__g) { e.preventDefault(); (window as any).__g = false; toast('Home'); }
        if (e.key === '?') { e.preventDefault(); showShortcuts = true; }
    };

    onMount(() => {
        window.addEventListener('keydown', handleKeys);
        const io = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                if (entry.isIntersecting && hasMore && !loadingMore) {
                    loadingMore = true;
                    await new Promise(r => setTimeout(r, 900)); // mock load
                    posts = [...posts, ...genMore(posts.length)];
                    if (posts.length > 20) hasMore = false;
                    loadingMore = false;
                }
            });
        }, { rootMargin: '600px' });
        const el = document.getElementById('sentinel');
        if (el) io.observe(el);
        return () => { window.removeEventListener('keydown', handleKeys); io.disconnect(); };
    });

    function genMore(offset: number): Post[] {
        return Array.from({ length: 4 }).map((_, i) => ({
            id: `m${offset + i}`,
            community: ['sveltekit','tailwindcss','devops','product'][i % 4],
            author: ['nightcode','pixelform','ops-linda','pollster'][i % 4],
            title: ['Perf note: islands','Refactor classNames','Blue? No, neutral.','Poll: compact vs cozy'][i % 4],
            kind: (['text','image','link','poll'] as PostKind[])[i % 4],
            body: i % 4 === 2 ? 'Small write-up with a link *inside*.' : 'Neutral UI bestie.',
            images: i % 4 === 1 ? ['https://picsum.photos/seed/more'+i+'/900/600'] : undefined,
            linkUrl: i % 4 === 2 ? 'https://example.com/post' : undefined,
            poll: i % 4 === 3 ? { options: [{id:'a',label:'Compact',votes:5},{id:'b',label:'Cozy',votes:7}], total:12 } : undefined,
            createdAt: isoMinutesAgo(5 + i * 2),
            votes: 10 + i * 3, userVote: 0, comments: 3 + i
        }));
    }

    // --------------- Markdown-lite
    function renderMD(s?: string): string {
        if (!s) return '';
        return s
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="underline decoration-neutral-500 hover:decoration-neutral-300">$1</a>');
    }

    // --------------- Icons
    const paths: Record<string, string> = {
        home: 'M3 11.5 12 3l9 8.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z',
        grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z',
        fire: 'M13 2s2 4-1 7c-2 2-1 5 2 6 3-1 5-4 3-8 4 3 5 9 0 12-5 3-12 0-12-6 0-5 5-8 8-11Z',
        bookmark: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z',
        search: 'M11 3a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm10 18-5.4-5.4',
        up: 'M12 5l6 8H6l6-8Z',
        down: 'M12 19l-6-8h12l-6 8Z',
        comment: 'M4 5h16v10H7l-3 4V5Z',
        share: 'M7 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm10 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM17 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM8 11l8-4M8 13l8 4',
        save: 'M6 3h12v14l-6-3-6 3V3Z',
        close: 'M5 5l14 14M19 5 5 19',
        menu: 'M4 7h16M4 12h16M4 17h16',
        plus: 'M12 4v16M4 12h16',
        bell: 'M12 3a4 4 0 0 1 4 4v2c0 1.1.4 2.1 1.1 2.9L19 14v2H5v-2l1.9-2.1A4.9 4.9 0 0 0 8 9V7a4 4 0 0 1 4-4Zm0 18a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Z',
        dots: 'M6 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z',
        mail: 'M4 6h16v12H4V6Zm8 5 8-5M4 6l8 5M4 18l7-5m2 0 7 5',
        award: 'M12 2l3 6 6 .9-4.5 4.3 1 6-5.5-3-5.5 3 1-6L3 8.9 9 8l3-6Z',
        hide: 'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Zm9-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
        report: 'M12 2 2 22h20L12 2Zm0 7v5m0 4h.01',
        external: 'M14 3h7v7m-1-6-8 8M4 20l9-9',
    };

    // --------------- UI helpers
    function pct(n: number, total: number) { return Math.round((n / Math.max(total, 1)) * 100); }
</script>

<!-- Skip link -->
<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-neutral-900 text-neutral-100 px-3 py-2 rounded">Skip to content</a>

<!-- Header -->
<header class="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 bg-neutral-950/90 border-b border-neutral-800">
    <div class="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 h-14 flex items-center gap-3">
        <!-- Mobile menu -->
        <button aria-label="Open menu" class="md:hidden p-2 rounded border border-neutral-800 hover:bg-neutral-900 active:bg-neutral-900">
            <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300"><path d={paths.menu} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
        </button>

        <!-- Brand -->
        <div class="flex items-center gap-2">
            <div class="size-6 rounded bg-neutral-200"></div>
            <span class="font-semibold text-neutral-100 tracking-tight">Void</span>
        </div>

        <!-- Search -->
        <div class="flex-1 min-w-0">
            <label class="w-full group relative block">
                <span class="sr-only">Search</span>
                <input bind:this={searchEl} bind:value={search} placeholder="Search…  (/ to focus)"
                       class="w-full text-sm bg-neutral-950 text-neutral-200 placeholder:text-neutral-500 border border-neutral-800 rounded-md px-9 py-2 outline-none focus:ring-2 focus:ring-neutral-600 focus:border-neutral-700"/>
                <svg viewBox="0 0 24 24" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 stroke-neutral-400">
                    <path d={paths.search} stroke-width="1.5" fill="none" stroke-linecap="round"/>
                </svg>
            </label>
        </div>

        <!-- Actions -->
        <div class="hidden md:flex items-center gap-2">
            <button class="h-9 px-3 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900" on:click={() => showInbox = !showInbox}>
                <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300"><path d={paths.mail} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
            </button>
            <button class="h-9 px-2 rounded border border-neutral-800 hover:bg-neutral-900" aria-label="Notifications" on:click={() => showNotifications = !showNotifications}>
                <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300"><path d={paths.bell} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
            </button>
            <button class="h-9 px-3 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900" on:click={() => density = density === 'cozy' ? 'compact' : 'cozy' }>
                {density === 'cozy' ? 'Compact' : 'Cozy'}
            </button>
            <div class="h-9 w-9 rounded-full overflow-hidden border border-neutral-800"><img alt="" src={avatar('you')}/></div>
        </div>
    </div>

    <!-- Notifications Drawer -->
    {#if showNotifications}
        <div class="absolute right-4 top-14 w-96 max-w-[95vw] rounded-lg border border-neutral-800 bg-neutral-950 shadow-xl">
            <header class="px-4 py-3 border-b border-neutral-800 text-sm text-neutral-200 font-medium">Notifications</header>
            <ul class="divide-y divide-neutral-800">
                {#each notifications as n}
                    <li class="px-4 py-3 flex items-center gap-3">
                        <div class="size-8 rounded-full bg-neutral-800/70"></div>
                        <div class="flex-1">
                            <div class="text-sm text-neutral-200">{n.text}</div>
                            <div class="text-xs text-neutral-500">{n.time}</div>
                        </div>
                        <button class="text-xs px-2 h-7 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900">View</button>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}

    <!-- Inbox Drawer -->
    {#if showInbox}
        <div class="absolute right-20 top-14 w-96 max-w-[95vw] rounded-lg border border-neutral-800 bg-neutral-950 shadow-xl">
            <header class="px-4 py-3 border-b border-neutral-800 text-sm text-neutral-200 font-medium">Inbox</header>
            <ul class="divide-y divide-neutral-800">
                {#each inbox as m}
                    <li class="px-4 py-3 flex items-center gap-3">
                        <img src={avatar(m.from)} alt="" class="size-8 rounded-full border border-neutral-800"/>
                        <div class="flex-1">
                            <div class="text-sm text-neutral-200">u/{m.from}</div>
                            <div class="text-xs text-neutral-500">{m.preview}</div>
                        </div>
                        <span class="text-xs text-neutral-500">{m.time}</span>
                    </li>
                {/each}
            </ul>
            <footer class="px-3 py-2 border-t border-neutral-800 text-right">
                <button class="h-8 px-3 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900">Open messages</button>
            </footer>
        </div>
    {/if}
</header>

<!-- Layout -->
<div class="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)_320px] gap-4">
    <!-- Left nav -->
    <aside class="hidden md:block">
        <nav class="sticky top-16 space-y-1">
            {#each leftNav as item}
                <a href="#"
                   class="flex items-center gap-3 px-3 {density==='compact' ? 'h-9' : 'h-10'} rounded-md text-neutral-300 hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
                   aria-label={item.label}
                >
                    <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300">
                        <path d={paths[item.icon]} stroke-width="1.5" fill="none" stroke-linecap="round"/>
                    </svg>
                    <span class="text-sm">{item.label}</span>
                </a>
            {/each}

            <div class="pt-3 mt-3 border-t border-neutral-800/60">
                <button
                        class="w-full flex items-center gap-2 justify-center {density==='compact' ? 'h-9' : 'h-10'} rounded-md bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                        on:click={() => (showComposer = true)}
                >
                    <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-900"><path d={paths.plus} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                    <span class="text-sm font-medium">Create Post</span>
                </button>
            </div>
        </nav>
    </aside>

    <!-- Main feed -->
    <main id="main" class="min-w-0 space-y-4">
        <!-- Composer (inline collapsed) -->
        <div class="border border-neutral-800 rounded-lg bg-neutral-950">
            <div class="px-4 py-3 flex items-center gap-3">
                <img src={avatar('you')} alt="" class="size-8 rounded-full border border-neutral-800"/>
                <button
                        class="h-10 flex-1 text-left text-sm text-neutral-400 bg-neutral-950 border border-neutral-800 rounded px-3 hover:bg-neutral-900"
                        on:click={() => (showComposer = true)}
                >
                    Share something with the void…
                </button>
                <button class="h-10 px-3 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900" on:click={() => (showComposer = true)}>
                    Post
                </button>
            </div>
            <div class="border-t border-neutral-800 px-3 py-2 flex items-center gap-2 text-xs text-neutral-500">
                <span>Shortcuts:</span>
                <span class="rounded px-1.5 py-0.5 bg-neutral-900 border border-neutral-800">/ search</span>
                <span class="rounded px-1.5 py-0.5 bg-neutral-900 border border-neutral-800">c compose</span>
                <button class="ml-auto underline decoration-neutral-600 hover:decoration-neutral-400" on:click={() => showShortcuts=true}>see all (?)</button>
            </div>
        </div>

        <!-- Sort tabs -->
        <div class="flex items-center gap-2 text-sm">
            {#each (['hot','new','top'] as tabs) as t}
                <button
                        class="h-9 rounded-md px-3 border transition
                 {sort === t ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900'}"
                        on:click={() => setSort(t as any)}
                >
                    {t}
                </button>
            {/each}
            <div class="ml-auto flex items-center gap-2">
                <span class="text-xs text-neutral-500 hidden sm:inline">Sort:</span>
                <span class="text-xs px-2 py-1 rounded border border-neutral-800 bg-neutral-950 text-neutral-300">{sort}</span>
            </div>
        </div>

        <!-- Feed -->
        {#each sortedPosts() as p (p.id)}
            <article class="rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden">
                <div class="flex">
                    <!-- Vote column -->
                    <div class="w-12 flex flex-col items-center gap-1 py-3 border-r border-neutral-800 bg-neutral-950">
                        <button aria-label="Upvote" class="p-1 rounded hover:bg-neutral-900 {p.userVote === 1 ? 'ring-1 ring-neutral-600' : ''}" on:click={() => vote(p, 1)}>
                            <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-200"><path d={paths.up} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                        </button>
                        <div class="text-sm tabular-nums text-neutral-300">{p.votes}</div>
                        <button aria-label="Downvote" class="p-1 rounded hover:bg-neutral-900 {p.userVote === -1 ? 'ring-1 ring-neutral-600' : ''}" on:click={() => vote(p, -1)}>
                            <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-400"><path d={paths.down} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="flex-1 p-3 sm:p-4">
                        <header class="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <a class="hover:underline text-neutral-400" href="#">r/{p.community}</a>
                            <span>•</span>
                            <span>posted by <a class="hover:underline text-neutral-400" href="#">u/{p.author}</a></span>
                            <span>•</span>
                            <time datetime={p.createdAt}>{timeAgo(p.createdAt)}</time>
                        </header>

                        <h2 class="mt-1 text-neutral-100 font-medium text-base sm:text-lg leading-tight">{p.title}</h2>

                        <!-- Content -->
                        <div class="mt-2 space-y-3">
                            {#if p.kind === 'text' && p.body}
                                <div class="prose-sm prose-invert max-w-none prose-p:my-2" this={undefined}>
                                    <div class="text-neutral-300" use:htmlBind={renderMD(p.body)}></div>
                                </div>
                            {/if}

                            {#if p.kind === 'image' && p.images}
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {#each p.images as img}
                                        <figure class="rounded-md overflow-hidden border border-neutral-800 bg-neutral-900">
                                            <img src={img} alt="" class="w-full h-auto"/>
                                        </figure>
                                    {/each}
                                </div>
                                {#if p.body}<p class="text-sm text-neutral-300">{p.body}</p>{/if}
                            {/if}

                            {#if p.kind === 'link' && p.linkUrl}
                                <a class="block rounded-md border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 p-3" href={p.linkUrl} target="_blank" rel="noreferrer">
                                    <div class="text-sm text-neutral-200 flex items-center gap-2">
                                        <svg viewBox="0 0 24 24" class="size-4 stroke-neutral-300"><path d={paths.external} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                        {p.linkUrl}
                                    </div>
                                    {#if p.body}<p class="text-sm text-neutral-400 mt-1" use:htmlBind={renderMD(p.body!)}></p>{/if}
                                </a>
                            {/if}

                            {#if p.kind === 'poll' && p.poll}
                                <ul class="space-y-2">
                                    {#each p.poll.options as o}
                                        <li>
                                            <button class="w-full text-left text-sm rounded border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 p-2"
                                                    on:click={() => castVote(p, o.id)}>
                                                <div class="flex items-center justify-between">
                                                    <span class="text-neutral-200">{o.label}</span>
                                                    <span class="text-neutral-500 text-xs">{pct(o.votes, p.poll.total)}%</span>
                                                </div>
                                                <div class="mt-1 h-1.5 bg-neutral-900 rounded">
                                                    <div class="h-full bg-neutral-300 rounded" style={`width:${pct(o.votes, p.poll.total)}%`}></div>
                                                </div>
                                            </button>
                                        </li>
                                    {/each}
                                </ul>
                                {#if p.poll.votedId}<div class="text-xs text-neutral-500 mt-2">You voted. Total: {p.poll.total}</div>{/if}
                            {/if}
                        </div>

                        <!-- Awards -->
                        {#if p.awards}
                            <div class="mt-2 flex flex-wrap items-center gap-2">
                                {#each p.awards as a}
                  <span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-neutral-800 bg-neutral-950">
                    <svg viewBox="0 0 24 24" class="size-4 stroke-neutral-300"><path d={paths.award} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                      {a.name} × {a.count}
                  </span>
                                {/each}
                                <button class="text-xs px-2 py-1 rounded border border-neutral-800 hover:bg-neutral-900">Give award</button>
                            </div>
                        {/if}

                        <!-- Actions -->
                        <footer class="mt-3 flex flex-wrap items-center gap-2 text-sm">
                            <button class="h-9 px-2 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900 flex items-center gap-2" on:click={() => {openThread(p);}}>
                                <svg viewBox="0 0 24 24" class="size-4 stroke-neutral-300"><path d={paths.comment} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                {p.comments} comments
                            </button>
                            <div class="relative group">
                                <button class="h-9 px-2 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900 flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" class="size-4 stroke-neutral-300"><path d={paths.share} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                    share
                                </button>
                                <div class="absolute hidden group-hover:block mt-1 z-10 rounded border border-neutral-800 bg-neutral-950 shadow p-2 text-xs">
                                    <button class="block w-full text-left px-2 py-1 rounded hover:bg-neutral-900">Copy link</button>
                                    <button class="block w-full text-left px-2 py-1 rounded hover:bg-neutral-900">Open in new tab</button>
                                </div>
                            </div>
                            <button class="h-9 px-2 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900 flex items-center gap-2" on:click={() => toggleSave(p)}>
                                <svg viewBox="0 0 24 24" class="size-4 stroke-neutral-300"><path d={paths.save} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                {p.saved ? 'saved' : 'save'}
                            </button>
                            <button class="h-9 px-2 rounded border border-neutral-800 text-neutral-400 hover:bg-neutral-900 flex items-center gap-2">
                                <svg viewBox="0 0 24 24" class="size-4 stroke-neutral-400"><path d={paths.hide} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                hide
                            </button>
                            <button class="h-9 px-2 rounded border border-neutral-800 text-neutral-400 hover:bg-neutral-900 flex items-center gap-2">
                                <svg viewBox="0 0 24 24" class="size-4 stroke-neutral-400"><path d={paths.report} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                report
                            </button>
                            <button class="ml-auto h-9 px-2 rounded border border-neutral-800 text-neutral-400 hover:bg-neutral-900" aria-label="More">
                                <svg viewBox="0 0 24 24" class="size-4 stroke-neutral-400"><path d={paths.dots} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                            </button>
                        </footer>

                        <!-- Thread -->
                        {#if p.thread}
                            <section class="mt-4 border-t border-neutral-800 pt-3">
                                <CommentList {p}/>
                            </section>
                        {/if}
                    </div>
                </div>
            </article>
        {/each}

        <!-- Infinite scroll sentinel -->
        <div id="sentinel" class="h-10"></div>

        <!-- Loading more -->
        {#if loadingMore}
            <div class="space-y-3">
                {#each Array.from({length:2}) as _}
                    <div class="animate-pulse rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                        <div class="h-5 w-1/3 bg-neutral-800 rounded mb-3"></div>
                        <div class="h-4 w-2/3 bg-neutral-800 rounded mb-2"></div>
                        <div class="h-4 w-1/2 bg-neutral-800 rounded"></div>
                    </div>
                {/each}
            </div>
        {/if}
        {#if !hasMore}
            <div class="text-center text-neutral-500 text-sm py-6">No more posts</div>
        {/if}
    </main>

    <!-- Right rail -->
    <aside class="hidden lg:block">
        <div class="sticky top-16 space-y-4">
            <!-- About -->
            <section class="rounded-lg border border-neutral-800 bg-neutral-950">
                <header class="px-4 py-3 border-b border-neutral-800 text-sm text-neutral-200 font-medium">About</header>
                <div class="p-4 text-sm text-neutral-300">
                    Void is a minimalist social platform. No colors. No noise. Just signal.
                </div>
            </section>

            <!-- Trends -->
            <section class="rounded-lg border border-neutral-800 bg-neutral-950">
                <header class="px-4 py-3 border-b border-neutral-800 text-sm text-neutral-200 font-medium">Trending</header>
                <ul class="p-2">
                    {#each trends as t}
                        <li class="flex items-center justify-between px-2 py-2 rounded hover:bg-neutral-900">
                            <a class="text-sm text-neutral-300 hover:underline" href="#">#{t.tag}</a>
                            <span class="text-xs text-neutral-500">{t.posts} posts</span>
                        </li>
                    {/each}
                </ul>
            </section>

            <!-- Who to follow -->
            <section class="rounded-lg border border-neutral-800 bg-neutral-950">
                <header class="px-4 py-3 border-b border-neutral-800 text-sm text-neutral-200 font-medium">Who to follow</header>
                <ul class="p-2 space-y-2">
                    {#each whoToFollow as f}
                        <li class="flex items-center gap-3 px-2 py-2 rounded hover:bg-neutral-900">
                            <img src={f.avatar} alt="" class="size-8 rounded-full border border-neutral-800"/>
                            <div class="flex-1">
                                <div class="text-sm text-neutral-200">{f.user}</div>
                                <div class="text-xs text-neutral-500">{f.bio}</div>
                            </div>
                            <button class="text-xs h-7 px-2 rounded border border-neutral-800 hover:bg-neutral-900">Follow</button>
                        </li>
                    {/each}
                </ul>
            </section>

            <!-- Recently viewed / Create community -->
            <section class="rounded-lg border border-neutral-800 bg-neutral-950">
                <header class="px-4 py-3 border-b border-neutral-800 text-sm text-neutral-200 font-medium">Communities</header>
                <div class="p-3 space-y-2">
                    {#each topCommunities.slice(0,3) as c}
                        <div class="flex items-center justify-between">
                            <a class="text-sm text-neutral-300 hover:underline" href="#">r/{c.name}</a>
                            <span class="text-xs text-neutral-500">{c.members}</span>
                        </div>
                    {/each}
                    <button class="w-full h-9 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900 mt-2">Create community</button>
                </div>
            </section>
        </div>
    </aside>
</div>

<!-- Mobile bottom nav -->
<nav class="md:hidden fixed bottom-0 inset-x-0 bg-neutral-950/95 border-t border-neutral-800 backdrop-blur">
    <div class="max-w-7xl mx-auto px-6 h-14 grid grid-cols-4">
        {#each leftNav.slice(0,4) as item}
            <a href="#" class="flex flex-col items-center justify-center gap-1 text-[11px] text-neutral-400">
                <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300"><path d={paths[item.icon]} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                {item.label}
            </a>
        {/each}
    </div>
</nav>

<!-- Composer modal -->
{#if showComposer}
    <div class="fixed inset-0 z-50 grid place-items-center p-4">
        <div class="absolute inset-0 bg-black/60" on:click={() => (showComposer = false)}></div>
        <div role="dialog" aria-modal="true" class="relative w-full max-w-2xl rounded-lg border border-neutral-800 bg-neutral-950 shadow-2xl">
            <header class="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <h3 class="text-sm font-medium text-neutral-200">Create post</h3>
                <button class="p-2 rounded hover:bg-neutral-900" aria-label="Close" on:click={() => (showComposer = false)}>
                    <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300"><path d={paths.close} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                </button>
            </header>
            <div class="p-4 space-y-3">
                <div class="grid sm:grid-cols-3 gap-3">
                    <label class="block">
                        <span class="text-xs text-neutral-400">Community</span>
                        <input class="mt-1 w-full h-10 rounded border border-neutral-800 bg-neutral-950 text-neutral-200 px-3 focus:ring-2 focus:ring-neutral-600"
                               bind:value={newPost.community}/>
                    </label>
                    <label class="block sm:col-span-2">
                        <span class="text-xs text-neutral-400">Title</span>
                        <input class="mt-1 w-full h-10 rounded border border-neutral-800 bg-neutral-950 text-neutral-200 px-3 focus:ring-2 focus:ring-neutral-600"
                               placeholder="What’s the headline?" bind:value={newPost.title}/>
                    </label>
                </div>

                <div class="flex gap-2 text-xs">
                    <button class="px-2 h-8 rounded border border-neutral-800 {newPost.kind==='text' ? 'bg-neutral-900' : 'bg-neutral-950 hover:bg-neutral-900'}" on:click={() => newPost.kind='text'}>Text</button>
                    <button class="px-2 h-8 rounded border border-neutral-800 {newPost.kind==='image' ? 'bg-neutral-900' : 'bg-neutral-950 hover:bg-neutral-900'}" on:click={() => newPost.kind='image'}>Image</button>
                    <button class="px-2 h-8 rounded border border-neutral-800 {newPost.kind==='link' ? 'bg-neutral-900' : 'bg-neutral-950 hover:bg-neutral-900'}" on:click={() => newPost.kind='link'}>Link</button>
                    <button class="px-2 h-8 rounded border border-neutral-800 {newPost.kind==='poll' ? 'bg-neutral-900' : 'bg-neutral-950 hover:bg-neutral-900'}" on:click={() => newPost.kind='poll'}>Poll</button>
                </div>

                {#if newPost.kind !== 'poll'}
                    <label class="block">
                        <span class="text-xs text-neutral-400">{newPost.kind === 'link' ? 'Description' : 'Body'} (markdown-lite)</span>
                        <textarea rows="6" class="mt-1 w-full rounded border border-neutral-800 bg-neutral-950 text-neutral-200 px-3 py-2 focus:ring-2 focus:ring-neutral-600"
                                  placeholder="Write something thoughtful…" bind:value={newPost.body}/>
                    </label>
                {/if}

                {#if newPost.kind === 'poll'}
                    <div class="text-xs text-neutral-400">Add options (mocked)</div>
                    <ul class="mt-1 space-y-1">
                        <li class="flex gap-2"><input class="flex-1 h-9 rounded border border-neutral-800 bg-neutral-950 px-2" placeholder="Option A"/></li>
                        <li class="flex gap-2"><input class="flex-1 h-9 rounded border border-neutral-800 bg-neutral-950 px-2" placeholder="Option B"/></li>
                    </ul>
                {/if}
            </div>
            <footer class="px-4 py-3 border-t border-neutral-800 flex items-center gap-2">
                <button class="h-9 px-3 rounded bg-neutral-100 text-neutral-900 hover:bg-neutral-200" on:click={submitPost}>Post</button>
                <button class="h-9 px-3 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900" on:click={() => (showComposer = false)}>Cancel</button>
                <div class="ml-auto text-xs text-neutral-500">Shift+Enter for newline • Press ? for shortcuts</div>
            </footer>
        </div>
    </div>
{/if}

<!-- Shortcuts modal -->
{#if showShortcuts}
    <div class="fixed inset-0 z-50 grid place-items-center p-4">
        <div class="absolute inset-0 bg-black/60" on:click={() => (showShortcuts = false)}></div>
        <div class="relative w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-950 shadow-2xl">
            <header class="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <h3 class="text-sm font-medium text-neutral-200">Keyboard shortcuts</h3>
                <button class="p-2 rounded hover:bg-neutral-900" aria-label="Close" on:click={() => (showShortcuts = false)}>
                    <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300"><path d={paths.close} stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                </button>
            </header>
            <ul class="p-4 grid grid-cols-2 gap-3 text-sm">
                <li class="flex items-center justify-between"><span>/ focus search</span><kbd class="border border-neutral-700 rounded px-1">/</kbd></li>
                <li class="flex items-center justify-between"><span>Compose</span><kbd class="border border-neutral-700 rounded px-1">c</kbd></li>
                <li class="flex items-center justify-between"><span>Go home</span><kbd class="border border-neutral-700 rounded px-1">g h</kbd></li>
                <li class="flex items-center justify-between"><span>Help</span><kbd class="border border-neutral-700 rounded px-1">?</kbd></li>
            </ul>
        </div>
    </div>
{/if}

<!-- Toasts -->
<div class="fixed bottom-16 right-4 md:right-6 space-y-2 z-50">
    {#each toasts as t (t.id)}
        <div class="rounded border border-neutral-800 bg-neutral-950 shadow px-3 py-2 text-sm text-neutral-200">{t.text}</div>
    {/each}
</div>

<!-- CommentList component -->
<svelte:component this={undefined}/>
<script context="module" lang="ts">
    export let p: any;
</script>

<!-- Since Svelte single-file, define inline component using {#key} trick -->
{#key posts}
    {@html ''} <!-- no-op to allow local component below -->
{/key}

<!-- Local comment list via inline component pattern -->
{#if false}{/if}
<!-- we fake a component by using a snippet + slot-like function below -->
{#snippet CommentList({ p })}
    <ul class="space-y-3">
        {#each p.thread as c}
            <li class="border-l border-neutral-800 pl-3">
                <div class="flex items-start gap-2">
                    <img src={"https://api.dicebear.com/8.x/shapes/svg?seed="+c.author} alt="" class="size-6 rounded-full border border-neutral-800 mt-0.5"/>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 text-xs text-neutral-500">
                            <span class="text-neutral-300">u/{c.author}</span>
                            <span>•</span>
                            <time datetime={c.createdAt}>30m</time>
                        </div>
                        <div class="mt-1 text-sm text-neutral-200" use:htmlBind={renderMD(c.body)}></div>
                        <div class="mt-2 flex items-center gap-2 text-xs">
                            <button class="px-2 h-7 rounded border border-neutral-800 hover:bg-neutral-900" on:click={() => voteComment(c, 1)}>Upvote {c.votes}</button>
                            <button class="px-2 h-7 rounded border border-neutral-800 hover:bg-neutral-900" on:click={() => voteComment(c, -1)}>Downvote</button>
                            <button class="px-2 h-7 rounded border border-neutral-800 hover:bg-neutral-900">Reply</button>
                            <button class="px-2 h-7 rounded border border-neutral-800 hover:bg-neutral-900" on:click={() => toggleCollapse(c)}>{c.collapsed ? 'Expand' : 'Collapse'}</button>
                        </div>
                        {#if !c.collapsed && c.children?.length}
                            <ul class="mt-3 ml-3 space-y-2">
                                {#each c.children as cc}
                                    <li class="border-l border-neutral-800 pl-3">
                                        <div class="text-xs text-neutral-500"><span class="text-neutral-300">u/{cc.author}</span> • 28m</div>
                                        <div class="mt-1 text-sm text-neutral-200" use:htmlBind={renderMD(cc.body)}></div>
                                        <div class="mt-2 flex items-center gap-2 text-xs">
                                            <button class="px-2 h-7 rounded border border-neutral-800 hover:bg-neutral-900" on:click={() => voteComment(cc, 1)}>Upvote {cc.votes}</button>
                                            <button class="px-2 h-7 rounded border border-neutral-800 hover:bg-neutral-900" on:click={() => voteComment(cc, -1)}>Downvote</button>
                                            <button class="px-2 h-7 rounded border border-neutral-800 hover:bg-neutral-900">Reply</button>
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                </div>
            </li>
        {/each}
    </ul>
{/snippet}


<style>
    :global(html){ background:#0a0a0a; color-scheme:dark; }
    :global(:focus-visible){ outline:2px solid rgb(82 82 82 / 1); outline-offset:2px; }
    :global(*::-webkit-scrollbar){ height:10px; width:10px }
    :global(*::-webkit-scrollbar-thumb){ background:#262626; border:2px solid #0a0a0a; border-radius:999px }
    :global(*::-webkit-scrollbar-track){ background:transparent }
    .size-4{ width:1rem; height:1rem }
    .size-5{ width:1.25rem; height:1.25rem }
    .size-6{ width:1.5rem; height:1.5rem }
    .size-8{ width:2rem; height:2rem }
    .prose-invert :where(code){ background:#0f0f0f; border:1px solid #262626; padding:0.1rem 0.35rem; border-radius:0.25rem; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:.85em }
</style>
