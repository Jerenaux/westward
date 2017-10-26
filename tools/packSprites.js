/**
 * Created by Jerome on 26-10-17.
 */
var fs = require('fs');
var path = require('path');
var Spritesmith = require('spritesmith');

var myArgs = require('optimist').argv;
var indir = myArgs.i;
var sprites = [];

fs.readdir(indir,function(err,files){
    if(err) throw err;
    // List sprites to pack
    for(var i = 0; i < files.length; i++){
        if(files[i] != 'Thumbs.db') sprites.push(indir+files[i]);
    }
    console.log(sprites);

    // Pack sprites
    Spritesmith.run({src: sprites}, function handleResult (err, result) {
        if(err) throw err;
        console.log(result);

        // Write image
        fs.writeFile(myArgs.o+myArgs.n+'.png', result.image, function(err) {
            if(err) throw err;
            console.log('Image written');
        });

        // Write JSON
        var atlas = {
            frames: []
        };


        var fileNames = Object.keys(result.coordinates);
        for(var i = 0; i < fileNames.length; i++){
            var data = result.coordinates[fileNames[i]];
            var fileName = path.basename(fileNames[i],path.extname(fileNames[i]));
            atlas.frames.push({
                filename: fileName,
                frame: {x:data.x,y:data.y,w:data.width,h:data.height}
            });
        }

        fs.writeFile(myArgs.o+myArgs.n+'.json', JSON.stringify(atlas), function(err) {
            if(err) throw err;
            console.log('Atlas written');
        });
    });
});
