import './core';

if (process.platform === 'linux') {
    import('./linux');
} else if (process.platform === 'darwin') {
    import('./darwin');
} else if (process.platform === 'win32') {
    import('./win32');
}
