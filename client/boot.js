/**
 * Created by Jerome on 15-09-17.
 */

var Boot = {
    key: 'boot',
    preload: function(){
        Boot.mapDataLocation = '/maps';
        Boot.masterKey = 'master';
        this.load.json(Boot.masterKey,Boot.mapDataLocation+'/master.json');

        this.load.image('background', 'assets/sprites/background.png');
        this.load.atlas('UI', 'assets/sprites/ui.png', 'assets/sprites/ui.json');

        this.input.setTopOnly(false);
    },
    create: function(){
        Boot.scene = this;
        var masterData = this.cache.json.get(Boot.masterKey);
        Boot.tilesets = masterData.tilesets;
        Boot.masterData = masterData;

        this.add.image(0,0,'background').setOrigin(0);
        Boot.displayTitle();

        /*var graphics = this.add.graphics();
        graphics.setScrollFactor(0);
        graphics.lineStyle(1, 0x00ff00, 3);
        graphics.beginPath();
        graphics.moveTo(512, 0);
        graphics.lineTo(512, 576);
        graphics.strokePath();
        graphics.closePath();*/
    }
};

Boot.makeClassMenu = function(){
    var menu = new Menu('Class selection',false,Boot.scene);
    var classw = 250;
    var classh = 150;
    var padding = 20;
    var x = 1024/2 - classw - padding;
    var y = 576/2 - classh - padding;
    new Panel(x,y,classw,classh,'Solider');
    return menu;
};

Boot.displayTitle = function(){
    Boot.title = Boot.scene.add.text(512,115, 'Westward',  { font: '150px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 10 }).setOrigin(0.5,0);
    Boot.button = new BigButton(512-40,300,'Play',Boot.hideTitle,Boot.scene);
    Boot.button.display();
};

Boot.hideTitle = function(){
    Boot.button.hide();
    Boot.scene.tweens.add(
        {
            targets: Boot.title,
            alpha: 0,
            duration: 1000,
            onComplete: function(){
                //Boot.displayClassSelection();
                Boot.scene.scene.start('main');
            }
        });
};

Boot.displayClassSelection = function(){
    Boot.makeClassMenu().display();
};

