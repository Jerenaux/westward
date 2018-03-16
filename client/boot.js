/**
 * Created by Jerome on 15-09-17.
 */

var Boot = new Phaser.Class({

    Extends: Phaser.Scene,
    initialize: function Boot() {
        Phaser.Scene.call(this, { key: 'boot' });
        this.readyTicks = 0;
    },

    preload: function(){
        Boot.mapDataLocation = '/maps';
        Boot.masterKey = 'master';
        this.load.json(Boot.masterKey,Boot.mapDataLocation+'/master.json');

        this.load.image('background', 'assets/sprites/background.png');
    },

    create: function(){
        this.scene.launch('UI');

        var masterData = this.cache.json.get(Boot.masterKey);
        Boot.tilesets = masterData.tilesets;
        Boot.masterData = masterData;

        this.add.image(0,0,'background').setOrigin(0);
        this.displayTitle();
    },

    updateReadyTick: function() {
        this.readyTicks++;
        if (this.readyTicks == 2) this.displayButton();
    },

    displayTitle: function(){
        Boot.title = this.add.text(512,115, 'Westward',
            { font: '150px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 10 }
            ).setOrigin(0.5,0).setAlpha(0);
        var _boot = this;
        this.tweens.add({
            targets: Boot.title,
            alpha: 1,
            duration: 1000,
            onComplete: function(){
                _boot.updateReadyTick();
            }
        });

    },

    hideTitle: function(){
        var _boot = this;
        Boot.button.hide();
        this.tweens.add({
            targets: Boot.title,
            alpha: 0,
            duration: 1000,
            onComplete: function(){
                if(Client.isNewPlayer()){
                    UI.classMenu.display();
                }else {
                    UI.sceneTransition('title');
                }
            }
        });
    },

    displayButton: function(){
        Boot.button = new BigButton(512-40,300,'Play',this.hideTitle.bind(this));
        Boot.button.display();
    }
});

