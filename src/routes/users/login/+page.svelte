<script>
    import { goto } from '$app/navigation';
    import { registerUser } from '$lib/userApi';
    import QRWrapper from "$lib/components/QRWrapper.svelte";
    import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
    import { toast } from "svelte-sonner";
    import { userApi } from '$lib/users/apiClient';
    import { catlist } from '$lib/escort/store/catlistStore';
    import { tokenStore } from '$lib/store/tokenStore';

    let tab = 'login';
    let loginMethod = 'password';
    let forgotMethod = 'password';
    let login = { username: '', credential: '' };
    let register = { username: '', password: '', age: null };
    let acceptTerms = false;
    let forgot = { username: '', credential: '', newPass: '' };
    let passphrase = '';
    let otpUrl = '';
    let otp = '';
    let registerStep = 'form'; // 'form', 'otp', 'verifyOtp'

    function switchTab(t) {
        tab = t;
        login = { username: '', credential: '' };
        register = { username: '', password: '', age: null };
        forgot = { username: '', credential: '', newPass: '' };
        loginMethod = 'password';
        forgotMethod = 'password';
        registerStep = 'form';
    }

    async function handleLogin() {
        const body = {
            username: login.username,
            password: loginMethod === 'password' ? login.credential : null,
            otp: loginMethod === 'otp' ? login.credential : null
        };

        try {
            const userData = await userApi.post('/login', body);
            dSuserAuthStore.login({ username: userData.username });
            
            // Save catList to catlistStore if present in the response
            if (userData.catList) {
                console.log('User login response catList:', userData.catList);
                catlist.set(userData.catList);
            }
            
            // Handle tokens if present in response
            if (userData.tokens !== undefined) {
                tokenStore.setTokens(userData.tokens);
            }
            
            toast.success("¡Inicio de sesión correcto!");
            await goto('/');
        } catch (error) {
            console.error('Error de login:', error);
            toast.error(`Error al iniciar sesión: ${error.message || 'Error desconocido'}`);
        }
    }

    async function handleRegister() {
        if (register.username.length < 3) {
            toast.error('El nombre de usuario tiene que tener al menos 3 caracteres.');
            return;
        }

        if (register.password.length < 8) {
            toast.error('La contraseña tiene que tener al menos 8 caracteres.');
            return;
        }

        if (register.age < 18) {
            toast.error('Tenés que tener al menos 18 años para registrarte.');
            return;
        }

        if (!acceptTerms) {
            toast.error('Debes aceptar los Términos y Condiciones para registrarte.');
            return;
        }

        try {
            const response = await registerUser(register);
            passphrase = response.passphrase;
            otpUrl = response.otpUrl;
            registerStep = 'otp';
            dSuserAuthStore.login({ username: register.username });
            
            // Handle tokens if present in response
            if (response.tokens !== undefined) {
                tokenStore.setTokens(response.tokens);
            }
        } catch (error) {
            if (error.message === 'Username already exists') {
                toast.error('El nombre de usuario ya existe. Probá con otro.');
            } else if (error.message === 'Too many requests') {
                toast.error('Hiciste demasiados intentos de registro. Probá más tarde.');
            } else {
                console.error(error);
                toast.error('El registro falló. Intentá de nuevo.');
            }
        }
    }

    async function handleVerifyOtp() {
        try {
            const userData = await userApi.post('/validate/otp', { otp });
            dSuserAuthStore.login({ username: userData.username || 'user' });
            toast.success('¡Código verificado! Ya podés loguearte.');
            await goto('/');
        } catch (error) {
            console.error('Error al verificar OTP:', error);
            toast.error(`Ese código OTP no sirve: ${error.message || 'Error desconocido'}. Fijate bien e intentá de nuevo.`);
        }
    }

    async function handleForgot() {
        const body = {
            username: forgot.username,
            newPass: forgot.newPass,
        };

        if (forgotMethod === 'password') {
            body.passphrase = forgot.credential;
        } else if (forgotMethod === 'otp') {
            body.otp = forgot.credential;
        }

        try {
            await userApi.post('/forgot', body);
            toast.success('¡Restablecimiento de contraseña exitoso! Ahora podés iniciar sesión con tu nueva contraseña.');
            await goto('/users/login');
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            toast.error("Las credenciales son inválidas. Revisá tu usuario y contraseña e intentá de nuevo.");
        }
    }
</script>


<div class="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6 md:p-8">
    <div class="bg-black text-white rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ring-1 ring-white/10 p-6 sm:p-8 md:p-10">
        <!-- Título general -->
        {#if tab === 'login'}
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-5 md:mb-6">¡Bienvenido! <span>👋</span></h2>
        {/if}
        {#if tab === 'register'}
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-5 md:mb-6">¡Sumate! <span>✨</span></h2>
        {/if}
        {#if tab === 'forgot'}
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-5 md:mb-6">Tranqui, te ayudamos</h2>
        {/if}

        <!-- Navegación de pantallas -->
        <nav class="flex overflow-x-auto justify-center mb-4 sm:mb-6 md:mb-8 space-x-3 sm:space-x-6 md:space-x-8 text-sm sm:text-base md:text-lg">
            <button
                    class="pb-1 font-medium focus:outline-none {tab === 'login' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}"
                    on:click={() => switchTab('login')}
            >
                Ingresar
            </button>
            <button
                    class="pb-1 font-medium focus:outline-none {tab === 'register' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}"
                    on:click={() => switchTab('register')}
            >
                Registrarme
            </button>
            <button
                    class="pb-1 font-medium focus:outline-none {tab === 'forgot' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}"
                    on:click={() => switchTab('forgot')}
            >
                Olvidé mi contraseña
            </button>
        </nav>
        <div class="text-center text-sm sm:text-base md:text-lg text-gray-500 mb-4">
            No pedimos correo electrónico ni número de teléfono para proteger tu privacidad.
        </div>
        <!-- Forms -->
        {#if tab === 'login'}
            <form on:submit|preventDefault={handleLogin} class="space-y-4 sm:space-y-6 md:space-y-8">
                <div class="space-y-1">
                    <input
                            type="text"
                            placeholder="Tu username"
                            bind:value={login.username}
                            required
                            class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                </div>
                <div class="space-y-1">
                    <div class="flex space-x-3 sm:space-x-6 md:space-x-8 text-sm sm:text-base md:text-lg">
                        <button type="button" on:click={() => loginMethod = 'password'} class="pb-1 {loginMethod === 'password' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}">Contraseña</button>
                        <button type="button" on:click={() => loginMethod = 'otp'} class="pb-1 {loginMethod === 'otp' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}">OTP</button>
                    </div>
                    <input
                            type={loginMethod === 'password' ? 'password' : 'text'}
                            placeholder={loginMethod === 'password' ? '••••••••' : '123456'}
                            bind:value={login.credential}
                            required
                            class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                </div>
                <button
                        type="submit"
                        class="w-full py-2 sm:py-3 md:py-4 rounded-lg bg-white text-black font-medium text-sm sm:text-base md:text-lg hover:bg-gray-200 transition"
                >
                    Entrar
                </button>
            </form>
            <div class="flex justify-between text-xs sm:text-sm md:text-base text-gray-500 mt-3 sm:mt-4 md:mt-6">
                <a on:click={() => switchTab('forgot')} class="hover:text-gray-300 cursor-pointer">¿Olvidaste tu contraseña?</a>
                <a on:click={() => switchTab('register')} class="hover:text-gray-300 cursor-pointer">Registrate</a>
            </div>
        {/if}

        {#if tab === 'register'}
            {#if registerStep === 'form'}
                <form on:submit|preventDefault={handleRegister} class="space-y-4 sm:space-y-6 md:space-y-8">
                    <div class="space-y-1">
                        <label class="block text-sm sm:text-base md:text-lg">Username</label>
                        <input type="text" placeholder="Tu Username" bind:value={register.username} required class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20" />
                    </div>
                    <div class="space-y-1">
                        <label class="block text-sm sm:text-base md:text-lg">Password</label>
                        <input type="password" placeholder="••••••••" bind:value={register.password} required class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20" />
                    </div>
                    <div class="space-y-1">
                        <label class="block text-sm sm:text-base md:text-lg">Age</label>
                        <input type="number" min="18" placeholder="21" bind:value={register.age} required class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20" />
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="acceptTerms" bind:checked={acceptTerms} required class="form-checkbox h-4 w-4 text-white transition duration-150 ease-in-out" />
                        <label for="acceptTerms" class="text-sm sm:text-base md:text-lg text-gray-400">
                            Acepto los <a href="/terms" target="_blank" class="text-white hover:underline">Términos y Condiciones</a>
                        </label>
                    </div>
                    <button type="submit" class="w-full py-2 sm:py-3 md:py-4 rounded-lg bg-white text-black font-medium text-sm sm:text-base md:text-lg hover:bg-gray-200 transition">Register</button>
                </form>
            {/if}

            {#if registerStep === 'otp'}
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-5 md:mb-6">Configurá tu OTP</h2>
                <div class="text-center space-y-4">
                    <p>Guardá esta frase de recuperación en un lugar seguro. La vas a necesitar para recuperar tu cuenta.</p>
                    <p class="font-mono bg-gray-800 p-2 rounded">{passphrase}</p>
                    <p>Escaneá el código QR con tu app de autenticación.</p>
                    {#key otpUrl}
                        <div class="flex justify-center">
                            {#if otpUrl}
                            <QRWrapper otpUrl={otpUrl}/>
                            {/if}
                        </div>
                    {/key}
                    <button on:click={() => registerStep = 'verifyOtp'} class="w-full py-2 sm:py-3 md:py-4 rounded-lg bg-white text-black font-medium text-sm sm:text-base md:text-lg hover:bg-gray-200 transition">Continuá</button>
                </div>
            {/if}

            {#if registerStep === 'verifyOtp'}
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-5 md:mb-6">Verificá tu OTP</h2>
                <form on:submit|preventDefault={handleVerifyOtp} class="space-y-4 sm:space-y-6 md:space-y-8">
                    <div class="space-y-1">
                        <label class="block text-sm sm:text-base md:text-lg">Código OTP</label>
                        <input type="text" placeholder="123456" bind:value={otp} required class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20" />
                    </div>
                    <button type="submit" class="w-full py-2 sm:py-3 md:py-4 rounded-lg bg-white text-black font-medium text-sm sm:text-base md:text-lg hover:bg-gray-200 transition">Verificá</button>
                </form>
            {/if}
            <div class="text-center text-xs sm:text-sm md:text-base text-gray-500 mt-3 sm:mt-4 md:mt-6">
                ¿Ya tenés cuenta? <a on:click={() => switchTab('login')} class="text-white hover:underline cursor-pointer">Ingresá</a>
            </div>
        {/if}

        {#if tab === 'forgot'}
            <form on:submit|preventDefault={handleForgot} class="space-y-4 sm:space-y-6 md:space-y-8">
                <div class="space-y-1">
                    <input
                            type="text"
                            placeholder="Tu Username"
                            bind:value={forgot.username}
                            required
                            class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                </div>
                <div class="space-y-1">
                    <div class="flex space-x-3 sm:space-x-6 md:space-x-8 text-sm sm:text-base md:text-lg">
                        <button type="button" on:click={() => forgotMethod = 'password'} class="pb-1 {forgotMethod === 'password' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}">Frase secreta</button>
                        <button type="button" on:click={() => forgotMethod = 'otp'} class="pb-1 {forgotMethod === 'otp' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}">OTP</button>
                    </div>
                    <input
                            type="text"
                            placeholder={forgotMethod === 'password' ? 'Tu frase secreta' : '123456'}
                            bind:value={forgot.credential}
                            required
                            class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                </div>
                <div class="space-y-1">
                    <label class="block text-sm sm:text-base md:text-lg">Nueva Contraseña</label>
                    <input
                            type="password"
                            placeholder="••••••••"
                            bind:value={forgot.newPass}
                            required
                            class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                </div>
                <button
                        type="submit"
                        class="w-full py-2 sm:py-3 md:py-4 rounded-lg bg-white text-black font-medium text-sm sm:text-base md:text-lg hover:bg-gray-200 transition"
                >
                    Reiniciar contraseña
                </button>
            </form>
            <div class="text-center text-xs sm:text-sm md:text-base text-gray-500 mt-3 sm:mt-4 md:mt-6">
                ¿Recordaste? <a on:click={() => switchTab('login')} class="text-white hover:underline cursor-pointer">Ingresá</a>
            </div>
        {/if}
    </div>
</div>
