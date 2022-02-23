const screenshot = require('screenshot-desktop');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { app, globalShortcut, shell, Menu, Tray, ipcMain, BrowserWindow  } = require('electron');
const username = os.userInfo().username;
let constantPath = "";
let esharePath = "";
let tray = null;
var today = new Date();
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
let win = undefined;

function createWindow() {
	win = new BrowserWindow({
		width: 1024,
		height: 780,
		webPreferences: {
			nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
		},
	});
	win.setMenuBarVisibility(false);
	win.loadFile("ui/index.html");
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

  tray = new Tray('./img/tray.png');
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

async function eshareScreen(open = true) {
  if(!fs.existsSync(constantPath)) {
    await fs.mkdirSync(constantPath);
  }
  let randomName = stringRand(7);
  while(fs.existsSync(constantPath + randomName + '.png')) {
    randomName = stringRand(7);
  }
  await screenshot({ filename: constantPath + randomName + '.png' });
  if(open === true) {
    shell.openPath(constantPath + randomName + '.png');
  }
  let count = BrowserWindow.getAllWindows()
  .filter(b => {
    return b.isFocused()
  }).length;
  if(count === 0) {
    return;
  }
  const win = BrowserWindow.getAllWindows()[count -1];
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
}

ipcMain.on('request-images', async () => {
  let count = BrowserWindow.getAllWindows()
  .filter(b => {
    return b.isFocused()
  }).length;
  if(count === 0) {
    return;
  }
  const win = BrowserWindow.getAllWindows()[count -1];
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