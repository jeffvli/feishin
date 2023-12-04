import dayjs from 'dayjs';

const reset = '\x1b[0m';

const baseLog = (errorType: 'error' | 'info' | 'success' | 'warn') => {
    let logString = '';
    switch (errorType) {
        case 'error':
            logString = '\x1b[31m[ERROR]   ';
            break;
        case 'info':
            logString = '\x1b[34m[INFO]    ';
            break;
        case 'success':
            logString = '\x1b[32m[SUCCESS] ';
            break;
        case 'warn':
            logString = '\x1b[33m[WARNING] ';
            break;
        default:
            logString = '\x1b[34m[INFO]    ';
            break;
    }

    return (text: string, options?: { context?: Record<string, any>; toast?: boolean }): void => {
        // const { toast } = options || {};
        const now = dayjs().toISOString();
        console.log(`${logString}${now}${text}${JSON.stringify(options?.context)}${reset}`);
    };
};

export const fsLog = {
    error: baseLog('error'),
    info: baseLog('info'),
    success: baseLog('success'),
    warn: baseLog('warn'),
};
