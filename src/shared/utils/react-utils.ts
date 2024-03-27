import ReactDOM from 'react-dom';
import { type createRoot } from 'react-dom/client';

// TODO: Can't use import of createRoot directly because of 'Dynamic require of "react-dom/client" is not supported'
type ReactDom18 = typeof ReactDOM & {
    createRoot: typeof createRoot;
};

/**
 * Render a React element in a DOM element.
 * @param element React element to render.
 * @param container DOM element to render in.
 */
export function renderElement(
    element: React.ReactNode,
    container: Element,
): void {
    const root = (ReactDOM as ReactDom18).createRoot(
        document.createElement('div'),
    );
    const portal = ReactDOM.createPortal(element, container);
    root.render(portal);
}
