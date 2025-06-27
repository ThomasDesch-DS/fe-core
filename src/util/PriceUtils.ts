export function formatPrice(amount, currency = 'ARS') {
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}