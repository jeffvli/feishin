import { type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { logger } from '/@/renderer/utils/logger';

// Sour Player extras never take the app down: if one of them breaks it quietly disappears (and the
// problem is logged) while the rest of Sour Player keeps working.
export const SourSafe = ({ children, name }: { children: ReactNode; name: string }) => (
    <ErrorBoundary
        fallback={null}
        onError={(error) => logger.warn(`Sour Player: ${name} stopped working`, { error: String(error) })}
    >
        {children}
    </ErrorBoundary>
);
