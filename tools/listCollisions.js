/**
 * Created by Jerome on 26-09-17.
 */

var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;

var path = '/../assets/maps/';
var collisions = new SpaceMap();

function listCollisions(directory){
    if(!directory){
        console.log('ERROR : No directory specified! Arguments :');
        console.log('-i = directory relative to assets/maps containing the chunks to flatten');
        return;
    }


    var indir = __dirname+path+directory;
    fs.readdir(indir,function(err,files){
        for(var i = 0; i < files.length; i++){
            var f = files[i];
            if(f != 'master.json'){
                findCollisions(f);
            }
        }
    });

    /*Write SpaceMap*/
}

var myArgs = require('optimist').argv;
listCollisions(myArgs.i);