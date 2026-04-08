import { startTransition } from 'react';

export function runInUrlTransition(update: () => void): void {
    startTransition(update);
}
