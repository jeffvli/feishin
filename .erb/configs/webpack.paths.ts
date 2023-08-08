const path = require('path');

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const srcPath = path.join(rootPath, 'src');
const srcMainPath = path.join(srcPath, 'main');
const srcRemotePath = path.join(srcPath, 'remote');
const srcRendererPath = path.join(srcPath, 'renderer');

const releasePath = path.join(rootPath, 'release');
const appPath = path.join(releasePath, 'app');
const appPackagePath = path.join(appPath, 'package.json');
const appNodeModulesPath = path.join(appPath, 'node_modules');
const srcNodeModulesPath = path.join(srcPath, 'node_modules');

const distPath = path.join(appPath, 'dist');
const distMainPath = path.join(distPath, 'main');
const distRemotePath = path.join(distPath, 'remote');
const distRendererPath = path.join(distPath, 'renderer');
const distWebPath = path.join(distPath, 'web');

const buildPath = path.join(releasePath, 'build');

export default {
  rootPath,
  dllPath,
  srcPath,
  srcMainPath,
  srcRemotePath,
  srcRendererPath,
  releasePath,
  appPath,
  appPackagePath,
  appNodeModulesPath,
  srcNodeModulesPath,
  distPath,
  distMainPath,
  distRemotePath,
  distRendererPath,
  distWebPath,
  buildPath,
};
