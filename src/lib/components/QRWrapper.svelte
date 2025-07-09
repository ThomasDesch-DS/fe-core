<script lang="ts">
    import QrCode from 'svelte-qrcode';
    export let otpUrl: string
</script>

<div class="flex justify-center bg-white p-4 rounded-lg">
    <QrCode
            value={otpUrl}
            size={200}
    margin={2}
    level="M"
    fgColor="#000"
    bgColor="#fff"
    class="w-48 h-48"
    />
</div>