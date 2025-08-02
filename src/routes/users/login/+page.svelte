<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { registerUser } from '$lib/userApi';
    import QRWrapper from "$lib/components/QRWrapper.svelte";
    import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
    import { toast } from "svelte-sonner";
    import { userApi } from '$lib/users/apiClient';
    import { catlist } from '$lib/escort/store/catlistStore';
    import { tokenStore } from '$lib/store/tokenStore';
    import LoadingAnimation from "$lib/common/LoadingAnimation.svelte";
    import posthog from 'posthog-js';
    import { initPosthog } from '$lib/analytics/analytics';
    import { Gender } from '$lib/escort/types/gender';

    // --- initialize analytics and track page open ---
    onMount(() => {
        initPosthog();
        posthog.capture('pageOpen', {
            page: 'dsUserAuth',
            timestamp: new Date().toISOString()
        });
    });

    let tab = 'login';
    let loginMethod = 'password';
    let forgotMethod = 'password';
    let shared = { username: '', password: '' };
    let login = { credential: '' };
    let register = { age: null, gender: '' };
    let acceptTerms = false;
    let forgot = { credential: '', newPass: '' };
    let passphrase = '';
    let otpUrl = '';
    let otp = '';
    let registerStep = 'form'; // 'form', 'otp', 'verifyOtp'
    let isLoading = false;

    const genderOptions = [
        { value: Gender.MALE, label: 'Hombre / Male' },
        { value: Gender.FEMALE, label: 'Mujer / Female' },
        { value: Gender.NON_BINARY, label: 'No binarie / Non-binary' },
        { value: Gender.TRANSGENDER_MALE, label: 'Hombre trans / Transgender Male' },
        { value: Gender.TRANSGENDER_FEMALE, label: 'Mujer trans / Transgender Female' },
        { value: Gender.GENDER_FLUID, label: 'Género fluido / Gender Fluid' },
        { value: Gender.OTHER, label: 'Otro / Otra / Otre / Other' },
        { value: Gender.UNDISCLOSED, label: 'No especificado / Undisclosed' }
    ];

    function switchTab(t: string) {
        tab = t;
        login.credential = '';
        register = { age: null, gender: '' };
        forgot = { credential: '', newPass: '' };
        loginMethod = 'password';
        forgotMethod = 'password';
        registerStep = 'form';
    }

    async function handleLogin() {
        const body = {
            username: shared.username,
            password: loginMethod === 'password' ? shared.password : null,
            otp: loginMethod === 'otp' ? login.credential : null
        };

        isLoading = true;
        try {
            const userData = await userApi.post('/login', body);
            dSuserAuthStore.login({ username: userData.username });

            // Analytics: identify + capture login
            posthog.identify(userData.username, { userType: 'DSUser' });
            posthog.capture('login', {
                userType: 'DSUser',
                username: userData.username,
                timestamp: new Date().toISOString()
            });

            // Persist other data
            if (userData.catList) catlist.set(userData.catList);
            if (userData.tokens !== undefined) tokenStore.setTokens(userData.tokens);

            toast.success("¡Inicio de sesión correcto!");
            await goto('/');
        } catch (error) {
            console.error('Error de login:', error);
            toast.error(`Error al iniciar sesión: ${error.message || 'Error desconocido'}`);
        } finally {
            isLoading = false;
        }
    }

    async function handleRegister() {
        if (shared.username.length < 3) {
            toast.error('El nombre de usuario tiene que tener al menos 3 caracteres.');
            return;
        }
        if (shared.password.length < 8) {
            toast.error('La contraseña tiene que tener al menos 8 caracteres.');
            return;
        }
        if (register.age! < 18) {
            toast.error('Tenés que tener al menos 18 años para registrarte.');
            return;
        }
        if (!acceptTerms) {
            toast.error('Debes aceptar los Términos y Condiciones para registrarte.');
            return;
        }

        isLoading = true;
        try {
            const response = await registerUser({ ...register, username: shared.username, password: shared.password, gender: register.gender });
            passphrase = response.passphrase;
            otpUrl = response.otpUrl;
            registerStep = 'otp';
            dSuserAuthStore.login({ username: shared.username });

            // Analytics: identify + capture register
            posthog.identify(shared.username, { userType: 'DSUser' });
            posthog.capture('register', {
                userType: 'DSUser',
                username: shared.username,
                age: register.age,
                gender: register.gender,
                timestamp: new Date().toISOString()
            });

            if (response.tokens !== undefined) tokenStore.setTokens(response.tokens);
        } catch (error: any) {
            if (error.message === 'Username already exists') {
                toast.error('El nombre de usuario ya existe. Probá con otro.');
            } else if (error.message === 'Too many requests') {
                toast.error('Hiciste demasiados intentos de registro. Probá más tarde.');
            } else {
                console.error(error);
                toast.error('El registro falló. Intentá de nuevo.');
            }
        } finally {
            isLoading = false;
        }
    }

    async function handleVerifyOtp() {
        isLoading = true;
        try {
            const userData = await userApi.post('/validate/otp', { otp });
            dSuserAuthStore.login({ username: userData.username || shared.username });

            // Analytics: capture OTP verify
            posthog.capture('otpVerified', {
                userType: 'DSUser',
                username: userData.username || shared.username,
                timestamp: new Date().toISOString()
            });

            toast.success('¡Código verificado! Ya podés loguearte.');
            await goto('/');
        } catch (error) {
            console.error('Error al verificar OTP:', error);
            toast.error(`Ese código OTP no sirve: ${error.message || 'Error desconocido'}`);
        } finally {
            isLoading = false;
        }
    }

    async function handleForgot() {
        const body: any = { username: shared.username, newPass: forgot.newPass };
        if (forgotMethod === 'password') body.passphrase = forgot.credential;
        else if (forgotMethod === 'otp') body.otp = forgot.credential;

        isLoading = true;
        try {
            await userApi.post('/forgot', body);

            // Analytics: capture reset
            posthog.capture('passwordReset', {
                userType: 'DSUser',
                username: shared.username,
                timestamp: new Date().toISOString()
            });

            toast.success('¡Restablecimiento de contraseña exitoso!');
            await goto('/');
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            toast.error("Las credenciales son inválidas. Revisá tu usuario y contraseña e intentá de nuevo.");
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Accede a tu cuenta</title>
</svelte:head>

{#if isLoading}
    <div class="min-h-screen flex flex-col justify-center items-center bg-black px-4">
        <LoadingAnimation />
    </div>
{:else}
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
                            bind:value={shared.username}
                            required
                            class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                </div>
                <div class="space-y-1">
                    <div class="flex space-x-3 sm:space-x-6 md:space-x-8 text-sm sm:text-base md:text-lg">
                        <button type="button" on:click={() => loginMethod = 'password'} class="pb-1 {loginMethod === 'password' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}">Contraseña</button>
                        <button type="button" on:click={() => loginMethod = 'otp'} class="pb-1 {loginMethod === 'otp' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}">OTP</button>
                    </div>
                    {#if loginMethod === 'password'}
                        <input
                                type="password"
                                placeholder="••••••••"
                                bind:value={shared.password}
                                required
                                class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                    {:else}
                        <input
                                type='text'
                                placeholder='123456'
                                bind:value={login.credential}
                                required
                                class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                    {/if}
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
                        <label class="block text-sm sm:text-base md:text-lg">Nombre de usuario</label>
                        <input type="text" placeholder="Tu nombre de usuario" bind:value={shared.username} required class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20" />
                    </div>
                    <div class="space-y-1">
                        <label class="block text-sm sm:text-base md:text-lg">Contraseña</label>
                        <input type="password" placeholder="••••••••" bind:value={shared.password} required class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20" />
                    </div>
                    <div class="space-y-1">
                        <label class="block text-sm sm:text-base md:text-lg">Edad</label>
                        <input type="number" min="18" placeholder="21" bind:value={register.age} required class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20" />
                    </div>
                    <div class="space-y-1">
                        <label class="block text-sm sm:text-base md:text-lg">Género</label>
                        <select bind:value={register.gender} required class="w-full px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 bg-black text-gray-100 rounded-lg text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/20">
                            <option value="" disabled selected>Seleccioná tu género</option>
                            {#each genderOptions as option}
                                <option value={option.value}>{option.label}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="acceptTerms" bind:checked={acceptTerms} required class="form-checkbox h-4 w-4 text-white transition duration-150 ease-in-out" />
                        <label for="acceptTerms" class="text-sm sm:text-base md:text-lg text-gray-400">
                            Acepto los <a href="/terms" target="_blank" class="text-white hover:underline">Términos y Condiciones</a>
                        </label>
                    </div>
                    <button type="submit" class="w-full py-2 sm:py-3 md:py-4 rounded-lg bg-white text-black font-medium text-sm sm:text-base md:text-lg hover:bg-gray-200 transition">Registrarme</button>
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
                            bind:value={shared.username}
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
{/if}

