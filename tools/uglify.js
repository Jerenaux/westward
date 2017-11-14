/**
 * Created by Jerome on 13-11-17.
 */

var fs = require('fs');
var path = require('path');
var UglifyJS = require("uglify-js");

var dirs = ['../client','../shared'];

var code  = {};

for(var d = 0; d < dirs.length; d++){
    var indir = path.join(__dirname,dirs[d]);
    var files = fs.readdirSync(indir);
    for(var i = 0; i < files.length; i++){
        var fname = files[i];
        if(fname.substr(-1) != 'js') continue;
        console.log('reading '+fname);
        code[fname] = fs.readFileSync(path.join(indir,fname)).toString();
    }
}

var result = UglifyJS.minify(code);

console.log(result);


