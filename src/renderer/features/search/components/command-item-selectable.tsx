import { Command } from 'cmdk';
import { ComponentPropsWithoutRef, ReactNode, useEffect, useRef, useState } from 'react';

interface CommandItemSelectableProps
    extends Omit<ComponentPropsWithoutRef<typeof Command.Item>, 'children'> {
    children: (args: { isHighlighted: boolean }) => ReactNode;
}

export function CommandItemSelectable({ children, ...itemProps }: CommandItemSelectableProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isHighlighted, setIsHighlighted] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        setIsHighlighted(el.getAttribute('aria-selected') === 'true');

        const observer = new MutationObserver(() => {
            const selected = el.getAttribute('aria-selected') === 'true';
            setIsHighlighted(selected);
        });

        observer.observe(el, {
            attributeFilter: ['aria-selected'],
            attributes: true,
        });

        return () => observer.disconnect();
    }, []);

    return (
        <Command.Item {...itemProps} ref={ref}>
            {children({ isHighlighted })}
        </Command.Item>
    );
}
