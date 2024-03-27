import React, { useState } from 'react';
import { Infinity } from 'lucide-react';
import { useSubscription } from 'observable-hooks';

export function PlaybarButton(): JSX.Element {
    const [isActive, setIsActive] = useState(false);

    useSubscription(window.jukebox.stateChanged$, setIsActive);

    async function toggleJukebox(): Promise<void> {
        await window.jukebox.setEnabled(!window.jukebox.isEnabled);
    }

    return (
        <Spicetify.ReactComponent.TooltipWrapper
            label={'Enable jukebox'}
            showDelay={100}
            renderInline={false}
        >
            <button
                className={`main-repeatButton-button ${
                    isActive ? 'main-repeatButton-active' : ''
                }`}
                onClick={toggleJukebox}
            >
                <Infinity size={24} />
            </button>
        </Spicetify.ReactComponent.TooltipWrapper>
    );
}
