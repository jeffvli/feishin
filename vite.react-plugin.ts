import react from '@vitejs/plugin-react';

export function createReactPlugin() {
    return react({
        babel: {
            plugins: ['babel-plugin-react-compiler'],
        },
    });
}
