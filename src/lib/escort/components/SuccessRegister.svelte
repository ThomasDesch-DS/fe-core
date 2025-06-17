<script lang="ts">
    export let displayName: string;
</script>

<div class="text-center">
    <h2 class="text-3xl font-bold text-white mb-4">¡Registro exitoso, {displayName}!</h2>
    <div class="bg-green-900/70 border border-green-500 rounded-lg p-6 mb-6">
        <svg class="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-xl text-white mb-4">Estamos validando tu información de KYC.</p>
        <p class="text-white mb-2">Recibirás una notificación cuando tu cuenta esté lista.</p>
        <p class="text-white">Gracias por registrarte con nosotros.</p>
    </div>
</div>