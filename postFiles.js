const path = require('path');
const fs = require('fs');
// const axios = require('axios');

//joining path of directory
const directoryPath = path.join(__dirname, 'json-files/release-json');
//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(function (file,index) {
        let jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'json-files/release-json',file), 'utf-8'))
        axios({method:'put',
         data:{}
         })
        console.log(file)
    });
});
