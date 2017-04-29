/* eslint global-require: 1, flowtype-errors/show-errors: 0 */
// @flow
import { app, BrowserWindow } from 'electron'
import sunvox from 'sunvox-dll-node'
import abletonlink from 'abletonlink'

import MenuBuilder from './menu';

let mainWindow = null;

const SUNVOX_INIT_FLAGS = 0
sunvox.sv_init(null, 44100, 2, SUNVOX_INIT_FLAGS)
sunvox.sv_open_slot(0)

app.sunvox = sunvox

const link = new abletonlink();

const onDownbeat = []

let lastBeat = 0.0;
link.startUpdate(2, (beat, phase, bpm) => {
  beat = 0 ^ beat;
  sunvox.sv_send_event(0, 0, 0, 0, 0, 0x1f, Math.round(bpm))
  if(0 < beat - lastBeat) {
    console.log('beat', { beat, phase, bpm })
    if (phase < 1) {
      while (onDownbeat.length > 0) {
        const f = onDownbeat.pop()
        f(bpm)
      }
    }
    lastBeat = beat;
  }
});

app.playOnDownbeat = slot => {
  onDownbeat.push(bpm => {
    sunvox.sv_play_from_beginning(slot)
  })
}

app.stop = slot => {
  sunvox.sv_stop(slot)
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};


app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
