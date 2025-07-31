<script>
  import { onMount } from 'svelte';

  const tips = [
    "Tip: Nadie se entera lo que hacés acá. Tranqui, es secreto entre vos y vos.",
    "¿Olvidaste la clave? Usá tu passphrase, no seas colgado.",
    "¿Querés cambiar la cara en las fotos? Mandale al laboratorio de fantasías.",
    "Guardá tus escorts favoritos en el Catlist. Después no digas que no te avisé.",
    "¿Tenés una fantasía rara? Acá es el lugar. Después no digas que no te avisé.",
    "Consejo: Guardá tu passphrase. En serio, no la pierdas que después ni Dios te recupera la cuenta.",
    "Tip: Lo prohibido es más divertido.",
    "¿Probaste el laboratorio de fantasías? Hace magia, posta.",
    "Catlist: tu lista secreta de escorts favoritos. Solo para entendidos.",
    "¿Pagás en cripto? Tranqui, nadie lo va a saber.",
    "Laboratorio de fantasías: animate a probar cosas nuevas.",
    "Recordá: lo que pasa en la app, queda en la app.",
    "Si no te animás a mostrarte, usá face swap. Y listo.",
  ];

  let tipIndex = 0;
  let currentTip = tips[tipIndex];

  let interval;
  onMount(() => {
    interval = setInterval(() => {
      tipIndex = (tipIndex + 1) % tips.length;
      currentTip = tips[tipIndex];
    }, 2500);

    return () => clearInterval(interval);
  });
</script>

<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
  <span class="relative flex h-20 w-20 mb-6">
    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-40"></span>
    <span class="relative inline-flex h-20 w-20 rounded-full bg-white opacity-80"></span>
  </span>
  <div class="text-white text-center text-base md:text-lg font-normal select-none transition-all duration-300 max-w-xs md:max-w-md">
    <span class="opacity-80">{currentTip}</span>
  </div>
</div>
