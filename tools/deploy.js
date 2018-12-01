/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 28-10-18.
 */
var fs = require('fs');
var path = require('path');
var dircompare = require('dir-compare'); // https://www.npmjs.com/package/dir-compare

// TODO: make a clean deploy config file somewhere at some point
var files = ['index.html','package.json','server.js'];
var dirs =  ['admin','assets','client','config','lib','server','shared'];

var from = path.join(__dirname,'..');
var to = path.join(from,'..','westward-prototype');
console.log("Copying from",from,"to",to);

var sysExclude = [".git",".idea","node_modules"];
var devExclude = ["Logs","studio","tools","maps","chunk*","collisions.json","master.json","package-lock.json","TODO.md"];
var prodExclude = ["Procfile",".gitignore"];
// TODO: tackel chunks + collision.json, master.json

var excludes = sysExclude.concat(devExclude.concat(prodExclude)).join(",");
console.log("Excluding :",excludes);

var options = {
    compareDate: true,
    excludeFilter: excludes
};
var res = dircompare.compareSync(from, to, options);

//console.log(res);
// Left: present in dev, not in prod; right: present in prod, not in dev
var toRemove = [];
var toCopy = [];
res.diffSet.forEach(function(entry){
    if(entry.state == 'right'){
        var p = path.join(entry.path2,entry.name2);
        toRemove.push(p);
        fs.unlink(p,function(err){
            if(err) throw err;
        });
    }else if(entry.state == 'left' || entry.state == 'distinct'){
        toCopy.push(path.join(entry.path1,entry.name1));
    }
});
console.log("### Removed: ###");
console.log(toRemove);
console.log("### To copy: ###");
console.log(toCopy);

/*var copied = 0;
files.forEach(function(f){
    copyFile(path.join(from,f),path.join(to,f),function(){
        copied++;
        if(copied == files.length) console.log("All files copied");
    });
});*/

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