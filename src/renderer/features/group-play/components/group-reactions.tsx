import { create } from 'zustand';

import styles from './group-reactions.module.css';

interface Reaction {
    by: string;
    emoji: string;
    id: number;
    left: number;
}

// Reactions in a group float up from the bottom right for everyone, then disappear.
export const useReactions = create<{
    add: (emoji: string, by: string) => void;
    list: Reaction[];
}>((set) => ({
    add: (emoji, by) => {
        const id = Date.now() + Math.random();
        set((state) => ({
            list: [...state.list, { by, emoji, id, left: 10 + Math.random() * 70 }].slice(-20),
        }));
        window.setTimeout(
            () => set((state) => ({ list: state.list.filter((r) => r.id !== id) })),
            3200,
        );
    },
    list: [],
}));

export const REACTIONS = ['🔥', '❤️', '😂', '🎉', '😭', '🍋'];

export const FloatingReactions = () => {
    const list = useReactions((state) => state.list);
    if (!list.length) return null;
    return (
        <div className={styles.layer}>
            {list.map((r) => (
                <span className={styles.reaction} key={r.id} style={{ left: `${r.left}%` }}>
                    {r.emoji}
                    <small>{r.by}</small>
                </span>
            ))}
        </div>
    );
};
