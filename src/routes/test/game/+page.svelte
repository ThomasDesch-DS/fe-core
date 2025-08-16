<script lang="ts">
    import { onMount } from "svelte";

    // -------- Core state --------
    let cash = 0;                 // current money
    let totalEarned = 0;          // lifetime in this run (for prestige math)
    let clickPower = 1;           // base per click
    let clickMultiplier = 1;      // upgrades affect this
    let franchiseTokens = 0;      // prestige currency
    let franchiseMultiplier = 1;  // 1 + tokens*0.5

    type Producer = {
        id: string;
        name: string;
        icon: string;
        baseCost: number;
        baseCps: number;
        owned: number;
    };

    // AdVenture vibe: escalating costs, passive CPS
    const costFactor = 1.15;

    let producers: Producer[] = [
        { id: "flyer",     name: "Flyer Girl",        icon: "🪧", baseCost: 15,        baseCps: 0.1,  owned: 0 },
        { id: "dj",        name: "DJ Booth",          icon: "🎧", baseCost: 100,       baseCps: 1,    owned: 0 },
        { id: "bar",       name: "Signature Bar",     icon: "🍸", baseCost: 1_100,     baseCps: 8,    owned: 0 },
        { id: "room",      name: "Private Room",      icon: "🚪", baseCost: 12_000,    baseCps: 47,   owned: 0 },
        { id: "vip",       name: "VIP Lounge",        icon: "💎", baseCost: 130_000,   baseCps: 260,  owned: 0 },
        { id: "billboard", name: "City Billboard",    icon: "📢", baseCost: 1_400_000, baseCps: 1400, owned: 0 },
        { id: "club2",     name: "Second Club",       icon: "🏬", baseCost: 20_000_000,baseCps: 7800, owned: 0 },
    ];

    // buy x1/x10/x100 toggle
    let buyMode: 1 | 10 | 100 = 1;

    // -------- Upgrades (auto-generated) --------
    type Upgrade = {
        id: string;
        title: string;
        desc: string;
        cost: number;
        bought: boolean;
        visible: boolean;
        apply: () => void;
    };

    // will fill dynamically when you reach thresholds
    let upgrades: Upgrade[] = [];

    const thresholds = [10, 25, 50, 100];

    function ensureProducerUpgrades() {
        for (const p of producers) {
            for (const t of thresholds) {
                if (p.owned >= t && !upgrades.find((u) => u.id === `${p.id}-${t}`)) {
                    upgrades.push({
                        id: `${p.id}-${t}`,
                        title: `${p.name} x2 @ ${t}`,
                        desc: `${p.name} output doubled (owned ≥ ${t}).`,
                        cost: Math.floor(currentCost(p, 1) * 3),
                        bought: false,
                        visible: true,
                        apply: () => {
                            p.baseCps *= 2; // double output for that producer
                        },
                    });
                }
            }
        }

        // Global click upgrades appear by lifetime earnings milestones
        const clickMilestones: [string, number, number][] = [
            ["makeitrain1", 1_000, 2],
            ["makeitrain2", 50_000, 3],
            ["makeitrain3", 2_500_000, 5],
        ];
        for (const [id, need, mult] of clickMilestones) {
            if (totalEarned >= need && !upgrades.find((u) => u.id === id)) {
                upgrades.push({
                    id,
                    title: `Make It Rain x${mult}`,
                    desc: `Clicks give x${mult} tips (lifetime ≥ $${format(need)}).`,
                    cost: Math.floor(need * 0.6),
                    bought: false,
                    visible: true,
                    apply: () => (clickMultiplier *= mult),
                });
            }
        }
    }

    // -------- Derived stats --------
    $: cps = producers.reduce((sum, p) => sum + p.baseCps * p.owned, 0) * franchiseMultiplier;

    // geometric series for bulk price (like AC)
    function currentCost(p: Producer, qty = 1) {
        let total = 0;
        for (let i = 0; i < qty; i++) {
            total += p.baseCost * Math.pow(costFactor, p.owned + i);
        }
        return total;
    }

    function buy(p: Producer) {
        const price = currentCost(p, buyMode);
        if (cash >= price) {
            cash -= price;
            p.owned += buyMode;
            pop(`+${buyMode} ${p.name}`);
            ensureProducerUpgrades();
        } else {
            pop("Not enough cash", true);
        }
    }

    function clickStage() {
        const gain = (clickPower * clickMultiplier * franchiseMultiplier);
        cash += gain;
        totalEarned += gain;
        floaters.push(makeFloater(`+$${format(gain)}`));
    }

    // -------- Loop --------
    onMount(() => {
        let last = performance.now();
        const id = setInterval(() => {
            const now = performance.now();
            const dt = (now - last) / 1000;
            last = now;
            const gain = cps * dt;
            cash += gain;
            totalEarned += gain;

            // cleanup floaters
            floaters = floaters.filter((f) => now - f.created < 900);
            ensureProducerUpgrades();
        }, 50);
        return () => clearInterval(id);
    });

    // -------- Prestige / Soft Reset --------
    function prestigeGained() {
        // simple & juicy: floor(sqrt(total / 1e6))
        return Math.floor(Math.sqrt(totalEarned / 1_000_000));
    }
    function canPrestige() {
        return prestigeGained() > 0;
    }
    function franchiseReset() {
        const gained = prestigeGained();
        if (gained <= 0) return;

        franchiseTokens += gained;
        franchiseMultiplier = 1 + franchiseTokens * 0.5;

        // hard reset run state
        cash = 0;
        totalEarned = 0;
        clickPower = 1;
        clickMultiplier = 1;
        producers = producers.map((p) => ({ ...p, owned: 0 }));
        upgrades = [];
        pop(`Franchised +${gained} 🔥 (x${franchiseMultiplier.toFixed(1)} income)`);
    }

    // -------- Tiny UI helpers --------
    function format(n: number) {
        if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
        if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
        if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
        if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
        return n.toFixed(n < 10 ? 2 : 0);
    }

    // Toast-ish micro feedback
    let toasts: { id: number; text: string; danger?: boolean }[] = [];
    let toastId = 0;
    function pop(text: string, danger = false) {
        const id = ++toastId;
        toasts = [...toasts, { id, text, danger }];
        setTimeout(() => (toasts = toasts.filter((t) => t.id !== id)), 1600);
    }

    // Floating “+$” particles on click
    type Floater = { id: number; text: string; x: number; y: number; created: number };
    let fId = 0;
    let floaters: Floater[] = [];
    function makeFloater(text: string): Floater {
        const stage = document.getElementById("stage")!;
        const rect = stage.getBoundingClientRect();
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        return { id: ++fId, text, x, y, created: performance.now() };
    }

    function buyAllAffordable() {
        // QoL: try buying one of each visible producer
        for (const p of producers) {
            const price = currentCost(p, buyMode);
            if (cash >= price) buy(p);
        }
    }
</script>

<!-- -------- Layout (Vercel-ish dark) -------- -->
<div class="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-white/20">
    <!-- Top bar -->
    <header class="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div class="flex items-center gap-2">
                <div class="h-5 w-5 rounded-sm bg-white"></div>
                <span class="font-semibold tracking-tight">Frenetic Spaceship — Gentlemen’s Ops</span>
            </div>
            <div class="flex items-center gap-6 text-sm">
                <div class="opacity-80">Cash: <span class="font-semibold">$ {format(cash)}</span></div>
                <div class="opacity-80">/s: <span class="font-semibold">$ {format(cps)}</span></div>
                <div class="opacity-80">Franchise x{franchiseMultiplier.toFixed(1)} <span class="text-white/50">(tokens {franchiseTokens})</span></div>
            </div>
        </div>
    </header>

    <main class="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-12">
        <!-- Left: clicker stage -->
        <section class="md:col-span-5">
            <div
                    id="stage"
                    class="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 shadow-[0_0_0_1px_inset_rgba(255,255,255,0.04)]"
            >
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-lg font-semibold">Main Stage</h2>
                    <button
                            class="rounded-md border border-white/10 px-3 py-1 text-xs opacity-80 hover:opacity-100"
                            on:click={buyAllAffordable}
                            title="Try to buy one of each you can afford"
                    >
                        Quick Spend
                    </button>
                </div>

                <button
                        on:click={clickStage}
                        class="group relative mx-auto mt-2 flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-neutral-900 text-5xl md:h-96"
                >
                    <div
                            class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.07),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.06),transparent_50%)]"
                    />
                    <div class="pointer-events-none absolute inset-0 animate-pulse bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.05)_90deg,transparent_180deg)]" />
                    <span class="relative z-10 select-none tracking-tight">
            💃 Make it rain
          </span>
                    <span class="pointer-events-none absolute bottom-3 left-0 right-0 z-10 mx-auto w-max rounded-full border border-white/10 bg-neutral-950/70 px-3 py-1 text-xs text-white/70">
            +${format(clickPower * clickMultiplier * franchiseMultiplier)} / click
          </span>
                </button>

                <!-- floaters -->
                {#each floaters as f (f.id)}
                    <div
                            class="pointer-events-none absolute text-sm font-semibold text-emerald-300/90 will-change-transform animate-floatUp"
                            style={`left:${f.x}px; top:${f.y}px`}
                    >
                        {f.text}
                    </div>
                {/each}
            </div>

            <!-- Prestige -->
            <div class="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
                <div class="mb-2 flex items-center justify-between">
                    <h3 class="font-semibold">Franchise (soft reset)</h3>
                    <div class="text-xs text-white/60">Earn tokens by resetting after making enough money.</div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-sm">
                        Potential tokens now: <span class="font-semibold">{prestigeGained()}</span>
                        <span class="text-white/50"> (multiplier becomes x{(1 + (franchiseTokens + prestigeGained()) * 0.5).toFixed(1)})</span>
                    </div>
                    <button
                            class="rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-sm hover:bg-amber-500/20 disabled:opacity-40"
                            on:click={franchiseReset}
                            disabled={!canPrestige()}
                            title="Reset this run to stack a permanent income multiplier."
                    >
                        Open New Franchise
                    </button>
                </div>
            </div>
        </section>

        <!-- Right: shop + upgrades -->
        <section class="space-y-6 md:col-span-7">
            <!-- Buy panel -->
            <div class="rounded-2xl border border-white/10 bg-neutral-900 p-4">
                <div class="mb-3 flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Tienda (Generators)</h3>
                    <div class="flex items-center gap-2 text-xs">
                        <span class="text-white/60">Buy</span>
                        {#each [1,10,100] as n}
                            <button
                                    class="rounded-md border border-white/10 px-2 py-1"
                                    class:selected={buyMode === (n as 1|10|100)}
                                    on:click={() => (buyMode = n as 1|10|100)}
                            >
                                x{n}
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {#each producers as p (p.id)}
                        <button
                                class="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-950/50 p-3 text-left hover:border-white/20 disabled:opacity-40"
                                on:click={() => buy(p)}
                                disabled={cash < currentCost(p, buyMode)}
                                title={`Generates $${format(p.baseCps * franchiseMultiplier)} / s each`}
                        >
                            <div class="flex items-center gap-3">
                                <div class="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-neutral-900 text-xl">{p.icon}</div>
                                <div>
                                    <div class="font-medium">{p.name}</div>
                                    <div class="text-xs text-white/60">
                                        Owned {p.owned} • {format(p.baseCps * franchiseMultiplier)} /s each
                                    </div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-sm font-semibold">${format(currentCost(p, buyMode))}</div>
                                <div class="text-[10px] text-white/50">Buy x{buyMode}</div>
                            </div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Upgrades -->
            <div class="rounded-2xl border border-white/10 bg-neutral-900 p-4">
                <div class="mb-3 flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Upgrades</h3>
                    <div class="text-xs text-white/60">Unlocks show up as you scale.</div>
                </div>

                {#if upgrades.filter(u => !u.bought && u.visible).length === 0}
                    <div class="rounded-lg border border-white/10 p-4 text-sm text-white/60">
                        Keep grinding — more upgrades unlock at unit milestones and lifetime earnings.
                    </div>
                {:else}
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {#each upgrades as u (u.id)}
                            {#if !u.bought && u.visible}
                                <button
                                        class="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-950/50 p-3 text-left hover:border-white/20 disabled:opacity-40"
                                        on:click={() => {
                    if (cash >= u.cost) {
                      cash -= u.cost; u.bought = true; u.apply(); pop(`Bought ${u.title}`);
                    } else {
                      pop("Not enough cash", true);
                    }
                  }}
                                        disabled={cash < u.cost}
                                >
                                    <div>
                                        <div class="font-medium">{u.title}</div>
                                        <div class="text-xs text-white/60">{u.desc}</div>
                                    </div>
                                    <div class="text-right text-sm font-semibold">${format(u.cost)}</div>
                                </button>
                            {/if}
                        {/each}
                    </div>
                {/if}
            </div>
        </section>
    </main>

    <!-- Toaster (fixed for Svelte) -->
    <div class="pointer-events-none fixed inset-x-0 top-3 z-50 mx-auto flex max-w-md flex-col gap-2 px-3">
        {#each toasts as t (t.id)}
            <div
                    class={`pointer-events-auto rounded-md border px-3 py-2 text-sm shadow ${
          t.danger ? "border-red-400/40 bg-red-500/10" : "border-white/10 bg-neutral-900"
        }`}
            >
                {t.text}
            </div>
        {/each}
    </div>
</div>

<style>
    /* tiny helper animation for floaters */
    @keyframes floatUp {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-40px); opacity: 0; }
    }
    .animate-floatUp { animation: floatUp 0.9s ease-out forwards; }
    .selected { background: rgba(255,255,255,.06); }
</style>
