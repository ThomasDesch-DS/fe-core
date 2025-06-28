<script>
    import IconWhatsapp from '~icons/fa6-brands/whatsapp';
    import IconTelegram from '~icons/fa6-brands/telegram';
    import IconSms from '~icons/fa6-solid/message';
    import IconOther from '~icons/fa6-regular/address-card';

    export let type;
    export let value;

    const getIcon = (type) => {
        switch (type) {
            case 'WHATSAPP':
                return IconWhatsapp;
            case 'TELEGRAM':
                return IconTelegram;
            case 'SMS':
                return IconSms;
            default:
                return IconOther;
        }
    };

    const getHref = (type, value) => {
        const cleanValue = value.replace(/^@/, '').replace(/\s+/g, '');
        switch (type) {
            case 'WHATSAPP':
                return `https://wa.me/${cleanValue}`;
            case 'TELEGRAM':
                return `https://t.me/${cleanValue}`;
            case 'SMS':
                return `sms:${cleanValue}`;
            default:
                return null;
        }
    };

    const Icon = getIcon(type);
    const href = getHref(type, value);
</script>

{#if href}
    <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 border border-gray-700 px-3 py-1 rounded text-white hover:text-white hover:border-white transition"
    >
        <Icon class="w-5 h-5" />
        <span class="text-lg">{value}</span>
    </a>
{:else}
    <div class="flex items-center gap-2 border border-gray-700 px-3 py-1 rounded text-white">
        <Icon class="w-5 h-5" />
        <span class="text-lg">{value}</span>
    </div>
{/if}

<style>
    a > :global(svg) {
        transition: transform 0.2s ease;
    }
    a:hover > :global(svg) {
        transform: scale(1.1);
    }

</style>