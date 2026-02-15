import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Electron-builder afterAllArtifactBuild hook
 * Runs the app stream update script only for Linux builds
 * Returns the metainfo file path to be included in published artifacts
 */

// This is not a typescript file, and is called by electron-builder, so we cannot use typescript features here.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async function afterAllArtifactBuild(buildResult) {
    // Check if this build includes Linux as a target
    const isLinux = buildResult.platformToTargets
        .keys()
        .some((platform) => platform.name === 'linux');

    if (isLinux) {
        const updateScriptPath = path.join(__dirname, 'update-app-stream.mjs');
        const projectRoot = path.resolve(__dirname, '..');
        const metainfoFile = path.resolve(projectRoot, 'org.jeffvli.feishin.metainfo.xml');

        console.log('Running app stream update for Linux build...');

        try {
            execSync(`node ${updateScriptPath} --replace-if-version-missing`, {
                cwd: projectRoot,
                stdio: 'inherit',
            });

            // Return the metainfo file to be included in published artifacts
            return [metainfoFile];
        } catch (error) {
            console.error('Failed to update app stream:', error.message);
            throw error;
        }
    }

    // Return empty array if not a Linux build
    return [];
}
