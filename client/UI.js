/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 14-03-18.
 */

var UI = {
    key: 'UI',
    tooltipDepth: 20,

    preload: function () {
        UI.scene = this;
        console.log('preloading UI');
        this.load.atlas('UI', 'assets/sprites/ui.png', 'assets/sprites/ui.json');
        this.load.spritesheet('icons2', 'assets/sprites/icons.png',{frameWidth:25,frameHeight:24});
    },

    create: function () {
        this.scene.get('boot').updateReadyTick();
        this.scene.bringToTop();

        this.textures.addSpriteSheetFromAtlas(
            'tooltip',
            {
                atlas: 'UI',
                frame: 'tooltip',
                frameWidth: 13,
                frameHeight: 13,
                endFrame: 8
            }
        );
        UI.tooltip = new Tooltip();

        this.input.setTopOnly(false);
        this.input.on('pointermove',function(event){
            if(UI.tooltip) UI.tooltip.updatePosition(event.x,event.y);
        });
        this.input.on('gameobjectdown', function (pointer, gameObject) {
            console.warn(gameObject);
        });
    },

    getConfig: function(){
        return this.scene.sys.game.config;
    },

    getGameWidth: function(){
        return UI.getConfig().width;
    },

    getGameHeight: function(){
        return UI.getConfig().height;
    },

    handleNotifications: function(msgs){
        // TODO: add to localstorage for display in character panel
        var i = 0;
        msgs.forEach(function(msg){
            UI.showNotification(msg,i,msgs.length);
            i++;
        });
        // TODO: keep list of displayed notifications
    },

    showNotification: function(msg,i,nb){
        var notif = new Bubble(0,0,true); // TODO: use pool
        notif.update(msg);
        var x = (UI.getGameWidth()-notif.getWidth())/2 - notif.getOrigin();
        var y = UI.getGameHeight() + (notif.getHeight()+3)*i;
        notif.updatePosition(x,y);

        var tween = UI.scene.tweens.addCounter({
            from: y,
            to: y-(40*nb), // TODO: compute dest based on previous msg dest + current msg height
            duration: 300,
            paused: true,
            ease: 'Quad.easeOut',
            onStart: function(){
                notif.display();
            },
            onUpdate: function(tween){
                notif.updatePosition(x,tween.getValue());
            }
        });

        var delay = i*50;
        setTimeout(function(){
            tween.play();
        },delay);
    },

    makeClassMenu: function() {
        var title = new UIHolder(512,10,'center');
        title.setText('class selection');

        var menu = new Menu();
        var classw = 250;
        var classh = 150;
        var padding = 20;
        var tlx = 1024 / 2 - classw - padding;
        var y = 576 / 2 - classh - padding;
        var x = tlx;
        menu.addPanel('title',title);
        menu.addPanel('soldier',new Panel(x, y, classw, classh, 'Soldier'));
        x += classw+padding;
        menu.addPanel('merchant',new Panel(x, y, classw, classh, 'Merchant'));
        x = tlx;
        y += classh+padding;
        menu.addPanel('craftsman',new Panel(x, y, classw, classh, 'Craftsman'));
        x += classw+padding;
        menu.addPanel('explorer',new Panel(x, y, classw, classh, 'Explorer'));
        return menu;
    }

};
