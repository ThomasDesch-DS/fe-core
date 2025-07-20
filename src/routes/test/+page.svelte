<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    // your 💰 count & income
    let money = 0;
    let perSecond = 0;

    type Upgrade = {
        name: string;
        count: number;
        baseCost: number;
        cost: number;
        income: number;
    };

    // the “business units” you can buy
    let upgrades: Upgrade[] = [
        { name: 'Dancer',      count: 0, baseCost: 10,   cost: 10,    income: 1   },
        { name: 'VIP Room',    count: 0, baseCost: 100,  cost: 100,   income: 10  },
        { name: 'Cocktail Bar',count: 0, baseCost: 1000, cost: 1000,  income: 100 }
    ];

    function clickTip() {
        money += 1;
    }

    function buy(up: Upgrade) {
        if (money >= up.cost) {
            money -= up.cost;
            up.count += 1;
            // cost scales 15% each purchase
            up.cost = Math.floor(up.baseCost * Math.pow(1.15, up.count));
            calculatePerSecond();
        }
    }

    function calculatePerSecond() {
        perSecond = upgrades.reduce((sum, u) => sum + u.count * u.income, 0);
    }

    let interval: ReturnType<typeof setInterval>;

    onMount(() => {
        // auto-add income each second
        interval = setInterval(() => {
            money += perSecond;
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(interval);
    });
</script>

<div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
    <h1 class="text-5xl font-extrabold mb-6">Strip Club Tycoon 💃🍸</h1>
    <div class="text-2xl mb-4">
        Tips Collected: <span class="font-mono">${money}</span> 💵
    </div>
    <button
            on:click={clickTip}
            class="bg-pink-500 hover:bg-pink-600 text-white py-5 px-10 rounded-full text-3xl mb-6 shadow-lg transform hover:scale-105 transition"
    >
        Collect Tip +1
    </button>
    <div class="mb-6 text-lg">Income/sec: <span class="font-mono">{perSecond}</span> 🙌</div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {#each upgrades as up}
            <div class="bg-gray-800 p-6 rounded-xl shadow-md flex flex-col items-center">
                <h2 class="text-2xl font-semibold mb-2">{up.name}</h2>
                <div class="mb-1 text-sm">Owned: {up.count}</div>
                <div class="mb-3 text-sm">Cost: ${up.cost}</div>
                <button
                        on:click={() => buy(up)}
                        class="bg-green-400 hover:bg-green-500 disabled:opacity-50 text-black px-4 py-2 rounded-lg"
                        disabled={money < up.cost}
                >
                    Hire {up.name}
                </button>
            </div>
        {/each}
    </div>
</div>
