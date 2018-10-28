/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 28-10-18.
 */
var fs = require('fs');
var path = require('path');

// TODO: make a clean deploy config file somewhere at some point
var files = ['index.html','package.json','server.js'];
var dirs =  ['admin','assets','client','config','lib','server','shared'];

var from = path.join(__dirname,'..');
var to = path.join(from,'..','westward-prototype');
console.log("Copying from",from,"to",to);

var copied = 0;
files.forEach(function(f){
    copyFile(path.join(from,f),path.join(to,f),function(){
        copied++;
        if(copied == files.length) console.log("All files copied");
    });
});

function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}