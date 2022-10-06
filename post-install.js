const path = require('path');
const replace = require('replace-in-file');

// fix long prisma loading times caused by scanning from process.cwd(), which returns "/" when run in electron
// (thus it scans all files on the computer.) See https://github.com/prisma/prisma/issues/8484
// solution: we get the app path from main process via sync IPC
const options = {
  files: path.join(__dirname, '../release/app/node_modules/', '@prisma', 'client', 'index.js'),
  from: 'findSync(process.cwd()',
  to: `findSync(require("electron").ipcRenderer.sendSync('config:get-app-path')`,
};

const results = replace.sync(options);
console.log('build script: prisma fix', results);
