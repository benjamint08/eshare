const screenshot = require('screenshot-desktop');
const os = require('os');
const path = require('path');
const fs = require('fs');
const {FormData} = require('form-data');
const DiscordRPC = require('discord-rpc');
const { app, globalShortcut, shell, Menu, Tray, ipcMain, BrowserWindow, nativeImage  } = require('electron');
const { execSync } = require('child_process');
const username = os.userInfo().username;
let constantPath = "";
let esharePath = "";
const ncp = require("copy-paste");
let tray = null;
var today = new Date();
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
let win = undefined;
let sessionShots = 0;

// RPC
const clientId = '946156291401842698';
const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();
let richpresence = false;

function createWindow() {
	win = new BrowserWindow({
		width: 1024,
		height: 780,
    icon: __dirname + "build/icon.png",
		webPreferences: {
			nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
		},
	});
	win.setMenuBarVisibility(false);
	win.loadFile("ui/index.html");
  win.webContents
  .executeJavaScript('localStorage.getItem("discordRPC");', true)
  .then(result => {
    if(result === 'true') {
      richpresence = true;
      rpc.login({ clientId }).catch(console.error);
    }
  });
}

app.on("window-all-closed", function() {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.whenReady().then(async () => {
  createWindow();
  const ret = globalShortcut.register('Alt+X', async () => {
    eshareScreen();
  });

  if (!ret) {
    console.log('registration failed');
  }
  tray = new Tray(__dirname + '/img/tray.png');
  tray.on('click', async function(e) {
    eshareScreen();
  });
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
});

if(process.platform === "darwin") {
    esharePath = '/Users/' + username + '/eshare/';
    constantPath = '/Users/' + username + '/eshare/';
    if(!fs.existsSync(constantPath)) {
      fs.mkdirSync(constantPath);
    }
    constantPath = constantPath + date + '/';
}

if(process.platform === "win32") {
    esharePath = 'C:/Users/' + username + '/eshare/';
    constantPath = 'C:/Users/' + username + '/eshare/';
    if(!fs.existsSync(constantPath)) {
      fs.mkdirSync(constantPath);
    }
    constantPath = constantPath + date + '/';
}

function stringRand(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function eshareScreen(open = false) {
  if(!fs.existsSync(constantPath)) {
    await fs.mkdirSync(constantPath);
  }
  let randomName = stringRand(7);
  while(fs.existsSync(constantPath + randomName + '.png')) {
    randomName = stringRand(7);
  }
  await screenshot({ filename: constantPath + randomName + '.png' });
  sessionShots++;
  const randomDescriptions = ['Taking pics', 'Alt+Xing people in 4K', 'Screenshotting NFTs', 'Flash turned on', 'Using eshare']
  var item = randomDescriptions[Math.floor(Math.random()*randomDescriptions.length)];
  if(richpresence === true) {
    setActivity('Taken ' + sessionShots.toString() + ' screenshots this session.', item);
  }
  if(open === true) {
    shell.openPath(constantPath + randomName + '.png');
  }
  let count = BrowserWindow.getAllWindows().length;
  if(count === 0) {
    return;
  }
  const win = BrowserWindow.getAllWindows()[0];
  let toSend = {
    success: true,
    everything: []
  }
  win.webContents
  .executeJavaScript('uploadImage("' + constantPath + randomName + '.png");', true);
  getDirectories(esharePath, function(e) {
    for(var fold in e) {
      let toAdd = {date: e[fold], images: []};
      fs.readdir(esharePath + e[fold], function (err, files) {
        for(var file in files) {
          if(files[file].endsWith('.png')) {
            toAdd.images.push({name: files[file], path: esharePath + e[fold] + '/' + files[file]});
          }
        }
        toSend.everything.push(toAdd);
        win.webContents.send('images', toSend);
      })
    }
  });
}

ipcMain.on('open-explorer', async (event, path) => {
  const path1 = path.split(path.split('/')[path.split('/').length -1])[0];
  const path2 = path1.split('file://')[1];
  if(process.platform === "darwin") {
    execSync('open ' + path2);
  }
  if(process.platform === "win32") {
    execSync('explorer ' + path2);
  }
});

ipcMain.on('image-info', async (event, name, date) => {
  let count = BrowserWindow.getAllWindows().length;
  if(count === 0) {
    return;
  }
  const win = BrowserWindow.getAllWindows()[0];
  const checkPath = esharePath + date + '/' + name;
  if(fs.existsSync(checkPath)) {
    win.webContents.send('image', {
      success: true,
      name: name,
      path: checkPath
    });
  } else {
    win.webContents.send('image', {
      success: false
    });
  }
});

ipcMain.on('settings', async () => {
  win = new BrowserWindow({
		width: 600,
		height: 750,
    icon: __dirname + "build/icon.png",
		webPreferences: {
			nodeIntegration: true
		},
	});
	win.setMenuBarVisibility(false);
	win.loadFile("ui/settings.html");
});

ipcMain.on('copy-clipboard', async (event, text) => {
  ncp.copy(text);
});

ipcMain.on('request-images', async () => {
  let count = BrowserWindow.getAllWindows().length;
  if(count === 0) {
    return;
  }
  const win = BrowserWindow.getAllWindows()[0];
  let toSend = {
    success: true,
    everything: []
  }
  getDirectories(esharePath, function(e) {
    for(var fold in e) {
      let toAdd = {date: e[fold], images: []};
      fs.readdir(esharePath + e[fold], function (err, files) {
        for(var file in files) {
          if(files[file].endsWith('.png')) {
            toAdd.images.push({name: files[file], path: esharePath + e[fold] + '/' + files[file]});
          }
        }
        toSend.everything.push(toAdd);
        win.webContents.send('images', toSend);
      })
    }
  });
});

const getDirectories = (source, callback) =>
  fs.readdir(source, { withFileTypes: true }, (err, files) => {
    if (err) {
      callback(err)
    } else {
      callback(
        files
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
      )
    }
})

async function setActivity(details, state) {
  if (!rpc) {
    return;
  }
  rpc.setActivity({
    details: details,
    state: state,
    startTimestamp,
    largeImageKey: 'icon',
    largeImageText: 'eshare',
    instance: false,
  });
}

rpc.on('ready', () => {
  setActivity('Waiting for something cool to happen...', 'Idling');
});