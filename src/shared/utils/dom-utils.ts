/**
 * Wait for an element to be available in the DOM.
 * @param selector The element's selector.
 * @param timeout The maximum waiting time, in milliseconds. If not provided, will use the default (5 seconds).
 * @param parentElement The parent element to observe. If not provided, will use the document body.
 * @returns The element.
 */
export async function waitForElement(
    selector: string,
    timeout: number = 5 * 1000,
    parentElement: HTMLElement | null = null,
): Promise<Element> {
    return await new Promise<Element>((resolve, reject) => {
        const element: Element | null = document.querySelector(selector);
        if (element !== null) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element: Element | null = document.querySelector(selector);
            if (element !== null) {
                resolve(element);
                observer.disconnect();
            }
        });

        if (parentElement === null) {
            parentElement = document.body;
        }

        observer.observe(parentElement, {
            childList: true,
            subtree: true,
        });

        setTimeout(() => {
            observer.disconnect();

            // Sometimes the observer do not work ?
            // So try one last time to find the element
            const element: Element | null = document.querySelector(selector);
            if (element !== null) {
                resolve(element);
            } else {
                reject(new Error(`Couldn't find the element "${selector}".`));
            }
        }, timeout);
    });
}
