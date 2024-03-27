function createProxyHandler<T extends object>(
    objectName: string,
): ProxyHandler<T> {
    const handler = {
        get(target: T, property: string, receiver: any) {
            const targetValue = Reflect.get(target, property, receiver);

            if (typeof targetValue === 'function') {
                return function (...args: unknown[]) {
                    const result = targetValue.apply(this, args);
                    console.log(
                        `[${objectName}] - CALL`,
                        property,
                        args,
                        `-->`,
                        result,
                    );
                    return result;
                };
            } else {
                console.log(
                    `[${objectName}] - GET`,
                    property,
                    '-->',
                    targetValue,
                );
                return targetValue;
            }
        },
    };

    return handler;
}

/**
 * Register a proxy around an instance of an object.
 * @param object The object to spy on.
 * @param objectName A name to be printed to the console.
 */
export function registerProxy<T>(object: T, objectName: string): void {
    const prototype = Object.create(Object.getPrototypeOf(object));
    Object.setPrototypeOf(
        object,
        new Proxy(prototype, createProxyHandler(objectName)),
    );

    console.log(`Registered proxy for ${objectName}.`);
}

/**
 * Wrap all APIs exposed by Spicetify.Platform with a proxy.
 */
export function registerPlatformProxies(): void {
    for (const [name, api] of Object.entries(Spicetify.Platform)) {
        registerProxy(api, name);
    }
}

export function registerServicesProxies(): void {
    const servicesMap = new Map<string, any>();

    for (const [platformName, platformApi] of Object.entries(
        Spicetify.Platform,
    )) {
        for (const [name, service] of Object.entries(platformApi as any).filter(
            ([n, s]) => n.startsWith('_'),
        )) {
            const fullName = `${platformName}.${name}`;
            if (!servicesMap.has(name)) {
                servicesMap.set(name, service);
                try {
                    registerProxy(service, fullName);
                } catch {}
            }
        }
    }

    console.log(servicesMap);
}
