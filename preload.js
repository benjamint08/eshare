const { ipcRenderer, contextBridge } = require("electron");


const API = {
    requestImages: () => ipcRenderer.send("request-images")
}

ipcRenderer.on('images', async (event, message) => {
    if(message.success === true) {
		// message.images is the array of json objects, display the images for every one in the doc :)
		// hope this helps
    }
});

contextBridge.exposeInMainWorld('eshare', API);