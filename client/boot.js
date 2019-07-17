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
        this.load.atlas('logo', 'assets/sprites/logo.png', 'assets/sprites/logo.json');
    },

    create: function(){
        Client.getBootParameters();

        var masterData = this.cache.json.get(Boot.masterKey);
        //Boot.tilesets = masterData.tilesets;
        Boot.masterData = masterData;

        Boot.background = this.add.image(0,0,'background').setOrigin(0);

        this.readyStages = {
            1: this.launchUI, // 1 for getting boot parameters
            2: this.displayButton // 2 for UI scene creation
        };
        this.displayTitle();

        Boot.WEBGL = true;

        try { gl = game.canvas.getContext("webgl"); }
        catch (x) { gl = null; }

        if(!gl){
            Boot.WEBGL = false;
            console.warn('WEBGL not supported');
            document.getElementById("danger").innerText = "Your browser does not support WebGL. Some visual effects will be disabled or may render poorly.";
        }

        if(detectBrowser() != "Chrome") document.getElementById("browser").innerText = "This development version is best played using Chrome. With other browsers, lag and rendering issues may arise.";
    },

    updateReadyTick: function() {
        this.readyTicks++;
        if(this.readyTicks in this.readyStages) this.readyStages[this.readyTicks].call(this);
    },

    launchUI: function(){
        this.scene.launch('UI');
    },

    displayTitle: function(){
        Boot.titleBg = this.add.image(512,218,'logo','bg').setAlpha(0).setScale(0.5);
        Boot.title = this.add.image(512,218,'logo','text').setAlpha(0).setScale(0.5);

        this.tweens.add({
            targets: Boot.titleBg,
            alpha: 1,
            duration: 1000
        });

        this.tweens.add({
            targets: Boot.title,
            alpha: 1,
            duration: 1500,
            delay: 750,
            onComplete: this.updateReadyTick.bind(this)
        });
    },

    displayButton: function(){
        Boot.buttons = [];
        Boot.buttons.push(new BigButton(512,400,'Play',UI.launchGameMode,true)); // true = bigger

        if(Client.gameConfig.boot.offerTutorial) Boot.buttons.push(new BigButton(512, 450, 'Tutorial', UI.launchTutorialMode,true));

        Boot.buttons.forEach(function(b){
            b.display();
        })
    }
});

Boot.bootParamsReceived = function(){
    console.log('Boot parameters received');
    this.readyTicks++;
};
