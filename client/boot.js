/**
 * Created by Jerome on 15-09-17.
 */

var Boot = new Phaser.Class({

    Extends: Phaser.Scene,
    initialize: function Boot() {
        Phaser.Scene.call(this, { key: 'boot',plugins: ['Clock','DataManagerPlugin','InputPlugin','Loader','TweenManager','LightsPlugin']});
        this.readyTicks = 0;
    },

    preload: function(){
        Boot.mapDataLocation = '/maps';
        Boot.masterKey = 'master';
        this.load.json(Boot.masterKey,Boot.mapDataLocation+'/master.json');

        this.load.image('background', 'assets/sprites/background.png');
        this.load.image('logo', 'assets/sprites/logo.png');
    },

    create: function(){
        Client.checkForNewPlayer();
        this.scene.launch('UI');

        var masterData = this.cache.json.get(Boot.masterKey);
        Boot.tilesets = masterData.tilesets;
        Boot.masterData = masterData;

        Boot.background = this.add.image(0,0,'background').setOrigin(0);


        this.totalReadyTicks = 2;
        this.onReady = this.displayButton;
        this.displayTitle();

        Boot.WEBGL = true;

        try { gl = game.canvas.getContext("webgl"); }
        catch (x) { gl = null; }

        if(!gl){
            Boot.WEBGL = false;
            console.warn('WEBGL not supported');
            document.getElementById("danger").innerText = "Your browser does not support WebGL. Some visual effects will be disabled or may render poorly.";
        }
    },

    updateReadyTick: function() {
        this.readyTicks++;
        if (this.readyTicks == this.totalReadyTicks) this.onReady.call(this);
    },

    displayTitle: function(){
        /*Boot.title = this.add.text(512,128, 'Westward',
            { font: '150px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 10 }
            ).setOrigin(0.5,0).setAlpha(0);*/
        Boot.title = this.add.image(512,218,'logo').setAlpha(0);

        this.tweens.add({
            targets: Boot.title,
            alpha: 1,
            duration: 1000,
            onComplete: this.updateReadyTick.bind(this)
        });
    },

    displayButton: function(){
        Boot.button = new BigButton(512,400,'Play',UI.leaveTitleScreen);
        Boot.button.display();
    }
});

