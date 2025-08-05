<script>
    import { onMount } from 'svelte';
    import posthog from 'posthog-js';

    let buttonText = 'Cargando...';
    let variantKey = null;
    let description = '';

    onMount(() => {
        posthog.onFeatureFlags(() => {
            variantKey = posthog.getFeatureFlag('nsfw_button_text_test');
            const payload = posthog.getFeatureFlagPayload('nsfw_button_text_test');

            buttonText = payload?.text || variantKey || 'Entrar';
            description = payload?.description || 'Sin descripción';

            // 🔥 Track the "view" event as soon as they see the variant
            posthog.capture('nsfw button viewed', {
                variant: variantKey,
                text: buttonText,
                description
            });
        });
    });

    function handleClick() {
        posthog.capture('nsfw button clicked', {
            variant: variantKey,
            text: buttonText,
            description
        });
        alert(`Tracked click for variant: ${variantKey}`);
    }
</script>

<main style="display: flex; flex-direction: column; align-items: center; gap: 2rem; margin-top: 5rem;">
    <h1>NSFW Chatbot Button Test</h1>
    <p>Variant: {variantKey}</p>
    <p>Description: {description}</p>
    <button
            on:click={handleClick}
            style="
            padding: 1rem 2rem;
            font-size: 1.2rem;
            border: none;
            border-radius: 8px;
            background-color: hotpink;
            color: white;
            cursor: pointer;
        "
    >
        {buttonText}
    </button>
</main>
