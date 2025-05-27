import styles from './filter-bar.module.css';

export const FilterBar = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div
            className={styles.filterBar}
            {...props}
        >
            {children}
        </div>
    );
};
