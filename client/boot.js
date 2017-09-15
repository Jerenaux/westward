/**
 * Created by Jerome on 15-09-17.
 */

var Boot = {
    key: 'boot',
    preload: function(){
        Boot.mapDataLocation = 'assets/maps/chunks';
        Boot.masterKey = 'master';
        this.load.json(Boot.masterKey,Boot.mapDataLocation+'/master.json');
    },
    create: function(){
        var masterData = this.cache.json.get(Boot.masterKey);
        Boot.tilesets = masterData.tilesets;
        this.scene.start('main',masterData);
    }
};