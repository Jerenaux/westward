/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 04-09-18.
 */
var fs = require('fs');
var pathmodule = require('path');

var World = require('../shared/World.js').World;
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;

var myArgs = require('optimist').argv;
var mapsPath = myArgs.maps;

var masterData = JSON.parse(fs.readFileSync(pathmodule.join(mapsPath,'master.json')).toString());
World.readMasterData(masterData);

var collisions = new SpaceMap();
collisions.fromList(JSON.parse(fs.readFileSync(pathmodule.join(mapsPath,'collisions.json')).toString()));

var free = [];
for(var x = 0; x < World.worldWidth; x++){
    for(var y = 0; y < World.worldHeight; y++){
        if(!collisions.get(x,y)) free.push([x,y]);
    }
}

console.log(free.length," free cells");