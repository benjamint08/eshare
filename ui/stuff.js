function formPost(url, data_dict, success, error) {
    $.ajax({
        'type': 'POST',
        'url': url,
        'data': data_dict,
        'processData': false,
        'contentType': false,
        'type': 'POST',
        'success': success,
        'error': error
    });
}

async function uploadImage(path) {
    const result = localStorage;
    if(result.uploadToServer === 'true') {
        const data = new FormData();
        const toPost = result.postURL;
        console.log(result.customJSON);
        let needed = 0;
        let done = 0;
        const theJSON = JSON.parse(result.customJSON);
        for(var key in theJSON) {
            needed++;
        }
        for(var key in theJSON) {
            if(theJSON[key] === '%image%') {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const image = document.createElement('img');
                image.src = path;
                image.addEventListener('load', e => {
                    canvas.width = image.width;
                    canvas.height = image.height;
                    ctx.drawImage(image, 0, 0);
                    canvas.toBlob(async function(leblob) {
                        var file = new File([leblob], key);
                        file.type = "image/png";
                        data.append(key, file);
                        if(needed - done === 1) {
                            await finalPost(toPost, data);
                        }
                        done++;
                        canvas.remove();
                    });
                });
            } else {
                data.append(key, theJSON[key]);
                if(needed - done === 1) {
                    await finalPost(toPost, data);
                }
                done++;
            }
        }
    }
}

async function finalPost(toPost, data) {
    formPost(toPost, data, function(c) {
        window.eshare.copyClipboard(c);
    }, function(e) {
        console.log("error");
    });
}