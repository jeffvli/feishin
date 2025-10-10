import { ErrorHandler, EventCallback, TypedEventEmitter } from './types';

import { EventMap } from '/@/renderer/events/events';

class TypedEventEmitterImpl implements TypedEventEmitter<EventMap> {
    private errorHandler: ErrorHandler | null = null;
    private events: Map<string, EventCallback[]> = new Map();

    emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
        const callbacks = this.events.get(String(event));
        if (callbacks) {
            callbacks.forEach((callback) => {
                try {
                    callback(payload);
                } catch (error) {
                    this.handleError(error as Error, String(event), payload);
                }
            });
        }
    }

    off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
        const callbacks = this.events.get(String(event));
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
        const eventKey = String(event);
        if (!this.events.has(eventKey)) {
            this.events.set(eventKey, []);
        }
        this.events.get(eventKey)!.push(callback);
    }

    removeAllListeners<K extends keyof EventMap>(event?: K): void {
        if (event) {
            // Remove specific event listeners
            this.events.delete(String(event));
        } else {
            // Remove all listeners
            this.events.clear();
        }
    }

    setErrorHandler(handler: ErrorHandler): void {
        this.errorHandler = handler;
    }

    private handleError(error: Error, event: string, payload: any): void {
        if (this.errorHandler) {
            this.errorHandler(error, event, payload);
        } else {
            console.error(`Event emitter error for event "${event}":`, error, payload);
        }
    }
}

export const eventEmitter = new TypedEventEmitterImpl();
