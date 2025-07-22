<script>
    import { Turnstile } from 'svelte-turnstile';
    export let onVerify;
    export let siteKey;
    let token = "";

    function handleCallback(event) {
        token = event.detail.token;
        onVerify?.(token);
    }
    function handleExpired() {
        token = "";
        onVerify?.(token); // force parent to reset
    }
</script>

<Turnstile
        siteKey={siteKey}
        theme="dark"
        on:callback={handleCallback}
        on:expired={handleExpired}
/>
