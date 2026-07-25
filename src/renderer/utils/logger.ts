import { LogLevel, LogSeverity } from '/@/shared/logger/types';

export type { LogLevel, LogSeverity };

type ElectronLogApi = {
    debug: (...params: any[]) => void;
    error: (...params: any[]) => void;
    info: (...params: any[]) => void;
    sendToMain?: (message: {
        data: any[];
        level: LogSeverity;
        variables?: { processType: string };
    }) => void;
    warn: (...params: any[]) => void;
};

interface LogFn {
    (message?: string, meta?: any): void;
}

interface Logger {
    debug: LogFn;
    error: LogFn;
    info: LogFn;
    updateLogLevel: (level: LogLevel) => void;
    warn: LogFn;
}

const DEFAULT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const PROCESS_LABEL = '[renderer]';
const PROCESS_WIDTH = 10;
const LEVEL_WIDTH = 5;
const RESET = '\x1B[0m';

const levelColors: Record<LogSeverity, string> = {
    debug: '\x1B[38;2;100;149;237m', // #6495ED
    error: '\x1B[38;2;255;100;100m', // #ff6464
    info: '\x1B[38;2;76;175;80m', // #4caf50
    warn: '\x1B[38;2;225;125;50m', // #e17d32
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NO_OP: LogFn = (_message?: string, ..._optionalParams: any[]) => {};

const getElectronLog = (): ElectronLogApi | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    const electronLog = (window as Window & { __electronLog?: ElectronLogApi }).__electronLog;
    return electronLog ?? null;
};

const formatLogLine = (level: LogSeverity, message: string, count = 1): string => {
    const countStr = count > 1 ? ` (x${count})` : '';
    const levelLabel = `${levelColors[level]}${level.toUpperCase().padEnd(LEVEL_WIDTH, ' ')}${RESET}`;
    const processLabel = PROCESS_LABEL.padEnd(PROCESS_WIDTH, ' ');
    return `${new Date().toISOString()} ${levelLabel} ${processLabel} ${message}${countStr}`;
};

const forwardToElectronLog = (level: LogSeverity, message: string, meta?: any, count = 1) => {
    const electronLog = getElectronLog();
    if (!electronLog) {
        return;
    }

    const countStr = count > 1 ? ` (x${count})` : '';
    const forwardMessage = `${message}${countStr}`;
    const data = meta !== undefined ? [forwardMessage, meta] : [forwardMessage];

    if (typeof electronLog.sendToMain === 'function') {
        electronLog.sendToMain({
            data,
            level,
            variables: { processType: 'renderer' },
        });
        return;
    }

    if (meta !== undefined) {
        electronLog[level](forwardMessage, meta);
    } else {
        electronLog[level](forwardMessage);
    }
};

const syncLogLevelToMain = (level: LogLevel) => {
    if (typeof window === 'undefined' || !window.api?.ipc) {
        return;
    }

    window.api.ipc.send('logger-set-level', level);
};

export const normalizeLogLevel = (value: null | string | undefined): LogLevel => {
    if (value === 'debug' || value === 'info') {
        return value;
    }

    // Legacy warn/error/trace thresholds map to nearby levels.
    if (value === 'warn' || value === 'error') {
        return 'info';
    }

    if (value === 'trace') {
        return 'debug';
    }

    return DEFAULT_LOG_LEVEL;
};

// Debounce configuration
const DEBOUNCE_INTERVAL = 200; // milliseconds
const DEBOUNCE_MAP = new Map<string, { count: number; lastLog: number }>();

// Periodically flush the debounce map
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of DEBOUNCE_MAP.entries()) {
        if (now - value.lastLog >= DEBOUNCE_INTERVAL) {
            const [level, message, meta] = JSON.parse(key) as [LogSeverity, string, any];
            const messageStr = message ? String(message) : '';
            const logStr = formatLogLine(level, messageStr, value.count);

            if (meta !== undefined && meta !== null) {
                console.log(logStr, meta);
            } else {
                console.log(logStr);
            }

            forwardToElectronLog(level, messageStr, meta, value.count);

            DEBOUNCE_MAP.delete(key);
        }
    }
}, DEBOUNCE_INTERVAL);

class ConsoleLogger implements Logger {
    debug: LogFn = NO_OP;
    error: LogFn = NO_OP;
    info: LogFn = NO_OP;
    updateLogLevel: (level: LogLevel) => void;
    warn: LogFn = NO_OP;

    constructor() {
        const level = normalizeLogLevel(localStorage.getItem('log_level'));
        if (localStorage.getItem('log_level') !== level) {
            localStorage.setItem('log_level', level);
        }

        this.initializeLoggers(level);
        syncLogLevelToMain(level);

        this.updateLogLevel = (newLevel: LogLevel) => {
            this.initializeLoggers(newLevel);
            syncLogLevelToMain(newLevel);
        };
    }

    private initializeLoggers(level: LogLevel) {
        const withDebounce = (logLevel: LogSeverity): LogFn => {
            return (message?: any, meta?: any) => {
                const key = JSON.stringify([logLevel, message, meta]);
                const now = Date.now();
                const existing = DEBOUNCE_MAP.get(key);

                if (existing) {
                    existing.count++;
                    existing.lastLog = now;
                } else {
                    DEBOUNCE_MAP.set(key, { count: 1, lastLog: now });
                }
            };
        };

        this.error = withDebounce('error');
        this.warn = withDebounce('warn');
        this.info = withDebounce('info');
        this.debug = level === 'debug' ? withDebounce('debug') : NO_OP;
    }
}

export const logger = new ConsoleLogger();
