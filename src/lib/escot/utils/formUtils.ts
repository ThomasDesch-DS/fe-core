export function focusNextOnEnter(node: HTMLElement) {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const form = node.closest('form');
            if (!form) return;

            const focusable = Array.from(form.querySelectorAll('input, select, button, textarea')) as HTMLElement[];
            const index = focusable.indexOf(node);

            if (index > -1 && index < focusable.length - 1) {
                const nextElement = focusable[index + 1];
                if (nextElement) {
                    nextElement.focus();
                }
            } else if (index === focusable.length - 1) {
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