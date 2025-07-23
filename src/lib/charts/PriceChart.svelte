<script lang="ts">
    import { onMount } from 'svelte';
    import { Chart, registerables } from 'chart.js';
    Chart.register(...registerables);

    let canvas: HTMLCanvasElement;
    let chart: Chart;

    // Precio del usuario que querés consultar
    export let currentEscortPrice = 52;

    async function cargarDatosYRenderizarGrafico() {
        const res = await fetch(`http://localhost:8080/escort/prices`);
        const json = await res.json();

        const bins = json.bins;
        const promedio = json.averagePrice;

        const labels = bins.map(() => '');
        const data = bins.map(bin => bin.count);
        const colores = bins.map(bin =>
            bin.isUserBin ? '#f43f5e' :
                bin.isAverageBin ? '#22d3ee' :
                    '#818cf8'
        );

        // Destruir el gráfico anterior si existe (evita duplicados al hacer HMR)
        if (chart) {
            chart.destroy();
        }

        chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colores,
                    borderRadius: 3,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0
                }]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const bin = bins[ctx.dataIndex];
                                if (bin.isUserBin) return `Tu precio: $${currentEscortPrice}`;
                                if (bin.isAverageBin) return `Promedio: $${promedio.toFixed(2)}`;
                                return `${ctx.raw} competidores`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Rango de Precios',
                        color: '#fff',
                        font: { size: 18 }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { display: false },
                        title: {
                            display: true,
                            text: 'Barato                                     Caro',
                            color: '#fff',
                            font: { size: 14 }
                        }
                    },
                    y: {
                        grid: { color: '#333' },
                        ticks: { color: '#fff', beginAtZero: true },
                        title: {
                            display: true,
                            text: 'Cantidad de competidores',
                            color: '#fff'
                        }
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });
    }

    onMount(() => {
        cargarDatosYRenderizarGrafico();
    });
</script>

<canvas bind:this={canvas} width="800" height="200" class="bg-black rounded" />
