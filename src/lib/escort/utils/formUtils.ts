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