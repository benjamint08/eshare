const screenshot = require('screenshot-desktop');
const os = require('os');
const fs = require('fs');
const { app, globalShortcut, shell, Menu, Tray, ipcMain, BrowserWindow  } = require('electron');
const username = os.userInfo().username;
let constantPath = "";
let tray = null;
var today = new Date();
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
let win = undefined;

function createWindow() {
	win = new BrowserWindow({
		width: 1024,
		height: 780,
		webPreferences: {
			nodeIntegration: true
		},
    preload: __dirname + '/preload.js'
	});
	win.setMenuBarVisibility(false);
	win.loadFile("ui/index.html");
	console.log("Main Menu Launched.")
}

function main() {
	createWindow();
}
app.whenReady().then(main);

app.on("window-all-closed", function() {
	if (process.platform !== "darwin") {
		app.quit();
	}
});


app.whenReady().then(async () => {
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
    constantPath = '/Users/' + username + '/eshare/'
    if(!fs.existsSync(constantPath)) {
      fs.mkdirSync(constantPath);
    }
    constantPath = constantPath + date + '/';
}

if(process.platform === "win32") {
    constantPath = 'C:/Users/' + username + '/eshare/'
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
}

ipcMain.on('request-images', async () => {
  const win = BrowserWindow.getFocusedWindow();
  // Get all images and stuff and put the paths into an array of json objects below
  const arrayOfImages = [];
  // [{name: 'blabal.png', path: '/Users/test/eshare/2022-2-23/blabal.png'}, etc] ^^
  win.webContents.send('images', {
    success: true,
    images: arrayOfImages
  });
});