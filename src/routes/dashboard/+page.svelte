<script>
    import { authStore } from '$lib/escort/store/authStore';
    import { logout } from '$lib/escort/api/authApi';
    import { goto } from '$app/navigation';
    
    let isLoggingOut = false;
    
    const handleLogout = async () => {
        isLoggingOut = true;
        try {
            await logout();
            goto('/dashboard/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            isLoggingOut = false;
        }
    };
</script>

<div class="min-h-screen bg-black text-white p-8">
    <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">Dashboard</h1>
            <button 
                on:click={handleLogout}
                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                disabled={isLoggingOut}
            >
                {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
        </div>
        
        {#if $authStore.user}
            <div class="bg-gray-900 p-6 rounded-lg mb-6">
                <h2 class="text-xl font-semibold mb-4">Bienvenido, {$authStore.user.displayName || $authStore.user.email}</h2>
                <p class="text-gray-400">Esta es tu área personal de gestión.</p>
            </div>
        {:else}
            <div class="bg-gray-900 p-6 rounded-lg mb-6">
                <p class="text-gray-400">Cargando información de usuario...</p>
            </div>
        {/if}
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-900 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-3">Perfil</h3>
                <p class="text-gray-400 mb-4">Administra tu información personal y de perfil.</p>
                <button class="text-blue-400 hover:text-blue-300 transition">Editar perfil</button>
            </div>
            
            <div class="bg-gray-900 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-3">Servicios</h3>
                <p class="text-gray-400 mb-4">Gestiona tus servicios y disponibilidad.</p>
                <button class="text-blue-400 hover:text-blue-300 transition">Administrar servicios</button>
            </div>
            
            <div class="bg-gray-900 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-3">Mensajes</h3>
                <p class="text-gray-400 mb-4">Revisa tus mensajes y contactos.</p>
                <button class="text-blue-400 hover:text-blue-300 transition">Ver mensajes</button>
            </div>
            
            <div class="bg-gray-900 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-3">Estadísticas</h3>
                <p class="text-gray-400 mb-4">Analiza las visitas y el rendimiento de tu perfil.</p>
                <button class="text-blue-400 hover:text-blue-300 transition">Ver estadísticas</button>
            </div>
        </div>
    </div>
</div>