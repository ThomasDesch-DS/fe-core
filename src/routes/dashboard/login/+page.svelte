<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import posthog from 'posthog-js';
    import { login as escortLogin, requestPhoneCode, verifyPhoneCode } from '$lib/escort/api/authApi';
    import { escortAuthStore } from '$lib/escort/store/escortAuthStore.js';
    import { get } from 'svelte/store';
    import LoadingAnimation from "$lib/common/LoadingAnimation.svelte";
    import { trackUserLogin } from "$lib/analytics/analytics";
    import { formatToE164 } from "$lib/escort/utils/formUtils";

    let email = '';
    let phone = '';
    let password = '';
    let verificationCode = '';
    let error = '';
    let isLoading = false;
    let loginMethod: 'email' | 'phone' | 'phone-code' = 'email';
    let isWaitingForCode = false;
    let countdownTimer = 0;
    let resendInterval: number;
    let codeInputs: HTMLInputElement[] = [];

    const validate = () => {
        if (loginMethod === 'email') {
            if (!email) {
                error = 'Che, falta el email.';
                return false;
            }
            if (!password) {
                error = 'Che, falta la contraseña.';
                return false;
            }
            const re = /\S+@\S+\.\S+/;
            if (!re.test(email)) {
                error = 'Ese mail no pinta ser real.';
                return false;
            }
        } else if (loginMethod === 'phone') {
            if (!phone) {
                error = 'Che, falta el teléfono.';
                return false;
            }
            if (!password) {
                error = 'Che, falta la contraseña.';
                return false;
            }
            // Basic phone validation (at least 10 digits)
            const digitsOnly = phone.replace(/\D/g, '');
            if (digitsOnly.length < 10) {
                error = 'El teléfono debe tener al menos 10 dígitos.';
                return false;
            }
        } else if (loginMethod === 'phone-code') {
            if (!phone) {
                error = 'Che, falta el teléfono.';
                return false;
            }
            // Basic phone validation (at least 10 digits)
            const digitsOnly = phone.replace(/\D/g, '');
            if (digitsOnly.length < 10) {
                error = 'El teléfono debe tener al menos 10 dígitos.';
                return false;
            }
            if (isWaitingForCode && verificationCode.length !== 6) {
                error = 'Ingresá el código de 6 dígitos.';
                return false;
            }
        }
        
        error = '';
        return true;
    };

    const startCountdown = () => {
        countdownTimer = 60;
        resendInterval = setInterval(() => {
            countdownTimer -= 1;
            if (countdownTimer <= 0) {
                clearInterval(resendInterval);
            }
        }, 1000);
    };

    const requestCode = async () => {
        if (!validate()) return;

        isLoading = true;
        error = '';

        try {
            await requestPhoneCode(formatToE164(phone));
            isWaitingForCode = true;
            startCountdown();
            
            // Focus first code input
            setTimeout(() => {
                if (codeInputs[0]) codeInputs[0].focus();
            }, 100);
        } catch (err) {
            if (err.response && err.response.dsCode === 1000) {
                error = 'Teléfono no registrado.';
            } else {
                error = err.message || 'Error al enviar código. Intentá nuevamente.';
            }
        } finally {
            isLoading = false;
        }
    };

    const handleCodeInput = (index: number, event: Event) => {
        const target = event.target as HTMLInputElement;
        const value = target.value.replace(/\D/g, '').slice(0, 1);
        target.value = value;

        // Update verification code
        const codeArray = verificationCode.split('');
        codeArray[index] = value;
        verificationCode = codeArray.join('').padEnd(6, '').slice(0, 6);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = codeInputs[index + 1];
            if (nextInput) nextInput.focus();
        }

        // Auto-submit when all 6 digits are entered
        if (verificationCode.replace(/\s/g, '').length === 6) {
            setTimeout(handleCodeSubmit, 100);
        }
    };

    const handleCodeKeydown = (index: number, event: KeyboardEvent) => {
        if (event.key === 'Backspace' && !codeInputs[index].value && index > 0) {
            codeInputs[index - 1].focus();
        }
    };

    const handleCodeSubmit = async () => {
        if (!validate()) return;

        isLoading = true;
        error = '';

        try {
            const escortUser = await verifyPhoneCode(formatToE164(phone), verificationCode.replace(/\s/g, ''));
            
            // --- identify the user in PostHog ---
            posthog.identify(escortUser.id, {
                userType: 'Escort',
                email: escortUser.email,
                displayName: escortUser.displayName
            });

            trackUserLogin({ success: true, userType: 'Escort' });

            // now navigate
            goto('/dashboard');
        } catch (err) {
            if (err.response && err.response.dsCode === 1000) {
                error = 'Código incorrecto.';
            } else {
                error = err.message || 'Error al verificar código. Intentá nuevamente.';
            }
            trackUserLogin({ success: false, userType: 'Escort', error: err.message });
        } finally {
            isLoading = false;
        }
    };

    onMount(() => {
        // PostHog is initialized in +layout.ts
        return () => {
            if (resendInterval) {
                clearInterval(resendInterval);
            }
        };
    });

    const handleSubmit = async () => {
        if (loginMethod === 'phone-code') {
            await requestCode();
            return;
        }

        if (!validate()) return;

        isLoading = true;
        error = '';

        try {
            // Prepare login payload based on method
            const loginData = {
                email: loginMethod === 'email' ? email : null,
                phone: loginMethod === 'phone' ? formatToE164(phone) : null,
                pass: password
            };
            
            // call your API
            const escortUser = await escortLogin(loginData);
            // escortAuthStore.login(escortUser); // This call is now handled internally by escortLogin

            // --- identify the user in PostHog ---
            posthog.identify(escortUser.id, {
                userType: 'Escort',
                email: escortUser.email,
                displayName: escortUser.displayName
            });

            trackUserLogin({ success: true, userType: 'Escort' });

            // now navigate
            goto('/dashboard');
        } catch (err) {
            // Handle specific error responses from server
            if (err.response && err.response.dsCode === 1000) {
                error = 'Email/teléfono o contraseña incorrectos.';
            } else {
                error = err.message || 'Error al iniciar sesión. Intentá nuevamente.';
            }
            trackUserLogin({ success: false, userType: 'Escort', error: err.message });
        } finally {
            isLoading = false;
        }
    };
</script>

<svelte:head>
    <title>Entrar</title>
</svelte:head>

{#if isLoading}
    <div class="min-h-screen flex flex-col justify-center items-center bg-black px-4">
        <LoadingAnimation />
    </div>
{:else}
    <form on:submit|preventDefault={handleSubmit}
          class="min-h-screen flex flex-col justify-center items-center bg-black px-4">
        <div class="w-full max-w-sm space-y-6">
            <h1 class="text-white text-3xl font-semibold text-center">¡Bienvenido! 👋</h1>
            {#if error}
                <p class="text-red-500 text-sm text-center">{error}</p>
            {/if}

            <div class="space-y-4">
                {#if !isWaitingForCode}
                    <div>
                        <div class="grid grid-cols-3 gap-1 mb-3">
                            <button type="button" 
                                    class="py-2 px-2 rounded text-xs font-medium transition {loginMethod === 'email' ? 'bg-white text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
                                    on:click={() => { loginMethod = 'email'; phone = ''; error = ''; isWaitingForCode = false; }}>
                                Email
                            </button>
                            <button type="button" 
                                    class="py-2 px-2 rounded text-xs font-medium transition {loginMethod === 'phone' ? 'bg-white text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
                                    on:click={() => { loginMethod = 'phone'; email = ''; error = ''; isWaitingForCode = false; }}>
                                Tel + Pass
                            </button>
                            <button type="button" 
                                    class="py-2 px-2 rounded text-xs font-medium transition {loginMethod === 'phone-code' ? 'bg-white text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
                                    on:click={() => { loginMethod = 'phone-code'; email = ''; password = ''; error = ''; isWaitingForCode = false; }}>
                                Tel + Código
                            </button>
                        </div>
                        
                        {#if loginMethod === 'email'}
                            <div class="space-y-4">
                                <div>
                                    <label for="email" class="block text-gray-400 text-sm mb-1">Mail</label>
                                    <input id="email" type="email" bind:value={email}
                                           placeholder="tunombre@correo.com"
                                           class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white" />
                                </div>
                                <div>
                                    <label for="password" class="block text-gray-400 text-sm mb-1">Contraseña</label>
                                    <input id="password" type="password" bind:value={password}
                                           placeholder="••••••••"
                                           class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white" />
                                </div>
                            </div>
                        {:else if loginMethod === 'phone'}
                            <div class="space-y-4">
                                <div>
                                    <label for="phone" class="block text-gray-400 text-sm mb-1">Teléfono</label>
                                    <input id="phone" type="tel" bind:value={phone}
                                           placeholder="+54 9 11 1234-5678"
                                           class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white" />
                                </div>
                                <div>
                                    <label for="password" class="block text-gray-400 text-sm mb-1">Contraseña</label>
                                    <input id="password" type="password" bind:value={password}
                                           placeholder="••••••••"
                                           class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white" />
                                </div>
                            </div>
                        {:else if loginMethod === 'phone-code'}
                            <div>
                                <label for="phone-code" class="block text-gray-400 text-sm mb-1">Teléfono</label>
                                <input id="phone-code" type="tel" bind:value={phone}
                                       placeholder="+54 9 11 1234-5678"
                                       class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white" />
                                <p class="text-gray-500 text-xs mt-1">Te enviaremos un código de 6 dígitos por SMS</p>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div class="space-y-4">
                        <div class="text-center">
                            <div class="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                                <span class="text-2xl">📱</span>
                            </div>
                            <h3 class="text-white text-lg font-medium mb-2">Código enviado</h3>
                            <p class="text-gray-400 text-sm mb-4">
                                Enviamos un código de 6 dígitos a<br>
                                <span class="text-white font-medium">{formatToE164(phone)}</span>
                            </p>
                        </div>
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-gray-400 text-sm mb-3 text-center">Ingresá el código</label>
                                <div class="flex gap-2 justify-center">
                                    {#each Array(6) as _, i}
                                        <input
                                            bind:this={codeInputs[i]}
                                            type="text"
                                            inputmode="numeric"
                                            maxlength="1"
                                            on:input={(e) => handleCodeInput(i, e)}
                                            on:keydown={(e) => handleCodeKeydown(i, e)}
                                            class="w-12 h-12 text-center text-xl font-mono bg-gray-900 text-white border-2 border-gray-700 rounded focus:outline-none focus:border-white transition"
                                        />
                                    {/each}
                                </div>
                            </div>
                            
                            <div class="text-center">
                                {#if countdownTimer > 0}
                                    <p class="text-gray-500 text-sm">Podés solicitar un nuevo código en {countdownTimer}s</p>
                                {:else}
                                    <button type="button" 
                                            on:click={requestCode}
                                            class="text-white hover:text-gray-300 text-sm underline transition">
                                        Reenviar código
                                    </button>
                                {/if}
                            </div>
                            
                            <button type="button" 
                                    on:click={() => { isWaitingForCode = false; verificationCode = ''; error = ''; }}
                                    class="w-full py-2 text-gray-400 hover:text-gray-300 text-sm transition">
                                ← Volver
                            </button>
                        </div>
                    </div>
                {/if}
            </div>

            {#if !isWaitingForCode}
                <button type="submit"
                        class="w-full py-2 text-black bg-white font-medium rounded hover:bg-gray-200 transition"
                        disabled={isLoading}>
                    {#if loginMethod === 'phone-code'}
                        Enviar código
                    {:else}
                        Entrar
                    {/if}
                </button>
            {/if}

            <div class="flex justify-between text-sm">
                <button type="button" on:click={() => goto('/dashboard/forgot')}
                        class="text-gray-500 hover:text-gray-300 transition">
                    ¿Te olvidaste la contraseña?
                </button>
                <button type="button" on:click={() => goto('/dashboard/register')}
                        class="text-gray-500 hover:text-gray-300 transition">
                    Registrate
                </button>
            </div>
        </div>
    </form>
{/if}
