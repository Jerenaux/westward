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
        this.load.json('texts', 'assets/data/texts.json');
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

        UI.textsData = this.cache.json.get('texts');

        this.input.setTopOnly(false);
        this.input.on('pointermove',function(event){
            if(UI.tooltip) UI.tooltip.updatePosition(event.x,event.y);
        });
        /*this.input.on('gameobjectdown', function (pointer, gameObject) {
            console.warn(gameObject);
        });*/
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
        title.setText(UI.textsData['class_selection_title']);

        var menu = new Menu();
        var desch = 100;
        var classw = 250;
        var classh = 150;
        var padding = 20;
        var tlx = 1024 / 2 - classw - padding;
        var y = 100;
        var x = tlx;
        menu.addPanel('title',title);
        var infow = (2*classw)+padding;
        var info = menu.addPanel('info',new InfoPanel(x, y, infow, desch));
        var text = info.addText(10,10,UI.textsData['class_selection']);
        text.setWordWrapWidth(infow-10,true);
        y += desch + padding;
        this.makeClassPanel(menu,'soldier',x,y,classw,classh);
        x += classw+padding;
        menu.addPanel('merchant',new Panel(x, y, classw, classh, UI.textsData['class_merchant']));
        x = tlx;
        y += classh+padding;
        menu.addPanel('craftsman',new Panel(x, y, classw, classh, UI.textsData['class_craftsman']));
        x += classw+padding;
        menu.addPanel('explorer',new Panel(x, y, classw, classh, UI.textsData['class_explorer']));
        return menu;
    },

    makeClassPanel: function(menu,className,x,y,classw,classh){
        var panel = menu.addPanel(className,new InfoPanel(x, y, classw, classh, UI.textsData['class_'+className]));
        var text = panel.addText(10,15,UI.textsData[className+'_desc']);
        text.setWordWrapWidth(classw-10,true);
    }

};
