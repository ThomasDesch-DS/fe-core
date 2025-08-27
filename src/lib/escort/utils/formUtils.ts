export function focusNextOnEnter(node: HTMLElement) {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            // For textareas, allow Enter to create a new line if Shift is pressed.
            if (node.nodeName === 'TEXTAREA' && event.shiftKey) {
                return;
            }

            event.preventDefault();
            const form = node.closest('form');
            if (!form) return;

            // If this is an input or select element, directly submit the form
            if (node.nodeName === 'INPUT' || node.nodeName === 'SELECT' || node.nodeName === 'TEXTAREA') {
                const submitButton = form.querySelector('button[type="submit"]') as HTMLElement;
                if (submitButton) {
                    submitButton.click();
                    return;
                }
            }

            // Fallback to original behavior for buttons or other elements
            const focusable = Array.from(
                form.querySelectorAll('input, select, button, textarea')
            ) as HTMLElement[];
            
            const index = focusable.indexOf(node);

            if (index > -1 && index < focusable.length - 1) {
                const nextElement = focusable[index + 1];
                if (nextElement) {
                    nextElement.focus();
                }
            } else if (index === focusable.length - 1) {
                // If it's the last element, find and click the submit button
                const submitButton = form.querySelector('button[type="submit"]') as HTMLElement;
                if (submitButton) {
                    submitButton.click();
                }
            }
        }
    };

    node.addEventListener('keydown', handleKeyDown);

    return {
        destroy() {
            node.removeEventListener('keydown', handleKeyDown);
        }
    };
}

export function formatToE164(phoneNumber: string): string {
    // Remove all non-digits
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // If it already starts with country code, return with +
    if (digitsOnly.length >= 10) {
        // If it starts with 54 (Argentina) or other common codes
        if (digitsOnly.startsWith('54') && digitsOnly.length >= 12) {
            return `+${digitsOnly}`;
        }
        // If it starts with 9 (mobile indicator for Argentina), add 54
        if (digitsOnly.startsWith('9') && digitsOnly.length === 11) {
            return `+54${digitsOnly}`;
        }
        // If it's 10 digits, assume it's missing country code and mobile indicator
        if (digitsOnly.length === 10) {
            return `+549${digitsOnly}`;
        }
        // If it's 11 digits and doesn't start with 9, add 54
        if (digitsOnly.length === 11 && !digitsOnly.startsWith('9')) {
            return `+54${digitsOnly}`;
        }
        // Default: add + if not present
        return digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly}`;
    }
    
    // Return original if too short
    return phoneNumber;
}