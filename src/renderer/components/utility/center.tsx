export const Center = ({ children }: { children: React.ReactNode }) => {
    return (
        <div
            style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            {children}
        </div>
    );
};
