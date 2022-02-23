const { ipcRenderer, contextBridge } = require("electron");

const API = {
    requestImages: () => ipcRenderer.send("request-images")
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}

ipcRenderer.on('images', async (event, message) => {
    if(message.success === true) {
      const theDivToInsertInto = document.getElementById('ourDiv');
      removeAllChildNodes(theDivToInsertInto);
      const dates = message.everything
      for(var date in dates) {
        for(var image in dates[date].images) {
          const ourImage = dates[date].images[image];
          const imageName = ourImage.name;
          const imagePath = ourImage.path;
          // stuff
          const div1 = document.createElement('div');
          div1.classList = "col";
          div1.style.height = "8em";
          const div2 = document.createElement('div');
          div2.classList = "card shadow-sm";
          const div3 = document.createElement('div');
          div3.classList = "card-body text-center";
          const h4 = document.createElement('h4');
          h4.classList = "card-text text-center";
          h4.style.color = "black";
          const h4a = document.createElement('a');
          h4a.href = "image.html?name=" + imageName + "&date=" + dates[date];
          h4a.innerText = imageName;
          const theImage = document.createElement('img');
          theImage.src = imagePath;
          theImage.width = "85%";
          theDivToInsertInto.appendChild(div1);
          div1.appendChild(div2);
          div2.appendChild(div3);
          div3.appendChild(h4);
          h4.appendChild(h4a);
          div3.appendChild(theImage);
        }
      }
    }
});

contextBridge.exposeInMainWorld('eshare', API);