/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 14-03-18.
 */

var UI = {
    key: 'UI',
    tooltipDepth: 20,

    preload: function () {
        UI.scene = this;
        this.input.setGlobalTopOnly(true); // Prevent clicks to bubble down to game scene
        console.log('preloading UI');
        this.load.atlas('UI', 'assets/sprites/ui.png', 'assets/sprites/ui.json');
        this.load.spritesheet('icons2', 'assets/sprites/icons.png',{frameWidth:25,frameHeight:24});
        this.load.json('texts', 'assets/data/texts.json');

        this.load.image('bigbg', 'assets/sprites/bigbg.png');
        this.load.image('worldmap', 'assets/sprites/worldmap.png');
        this.load.image('compass', 'assets/sprites/compass.png');
        this.load.image('setlicon', 'assets/sprites/setlicon.png');
        this.load.image('wood', 'assets/sprites/wood.jpg');
    },

    create: function () {
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
        // todo: don't make if not new player
        UI.classMenu = UI.makeClassMenu();
        //UI.settlementMenu = UI.makeSettlementSelectionMenu();

        this.scene.get('boot').updateReadyTick();
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
        var desch = 60;
        var classw = 400;
        var classh = 195;
        var padding = 20;
        var tlx = 1024 / 2 - classw - padding;
        var y = 80;
        var x = tlx;
        menu.addPanel('title',title);
        var infow = (2*classw)+padding;
        var info = menu.addPanel('info',new InfoPanel(x, y, infow, desch));
        var text = info.addText(10,10,UI.textsData['class_selection'],Utils.colors.white,14,Utils.fonts.normal);
        y += desch + padding;
        this.makeClassPanel(menu,'soldier',x,y,classw,classh);
        x += classw+padding;
        this.makeClassPanel(menu,'craftsman',x,y,classw,classh);
        x = tlx;
        y += classh+padding;
        this.makeClassPanel(menu,'merchant',x,y,classw,classh);
        x += classw+padding;
        this.makeClassPanel(menu,'explorer',x,y,classw,classh);
        return menu;
    },

    makeClassPanel: function(menu,className,x,y,classw,classh){
        var panel = menu.addPanel(className,new ClassPanel(x, y, classw, classh, UI.textsData['class_'+className]));
        panel.setClass(className);
    },

    makeBattleTutorialPanel: function(){
        var h = 200;
        var w = 200;
        var y = UI.getGameHeight()-h;
        var panel = new InfoPanel(0,y,w,h,'Battle tutorial');
        panel.addText(UI.textsData['battle_help']);
        panel.addBigButton('Got it');
        return panel;
    },

    makeSettlementSelectionMenu: function(){
        UI.scene.add.image(0,0,'wood').setOrigin(0);
        var scroll = UI.scene.add.image(UI.getGameWidth()/2,UI.getGameHeight()/2,'bigbg');
        scroll.setScale(1.3);
        /*var scrollMask = UI.scene.add.image(UI.getGameWidth()/2,UI.getGameHeight()/2,'bigbg');
        scrollMask.setVisible(false);
        scrollMask.setScale(0.98);*/
        var map = UI.scene.add.image(UI.getGameWidth()/2,UI.getGameHeight()/2,'worldmap');
        //UI.scene.add.image(130,20,'compass').setOrigin(0).setScale(0.5);
        UI.scene.add.image(10,0,'compass').setOrigin(0).setScale(0.5);
        //map.setScale(0.75);
        map.x += 50;
        map.y += 150;
        map.mask = new Phaser.Display.Masks.BitmapMask(UI.scene,scroll);

        var icon1 = UI.scene.add.image(430,400,'setlicon');
        var icon2 = UI.scene.add.image(840,100,'setlicon');
        icon1.setInteractive();
        icon2.setInteractive();

        UI.scene.tweens.add({
            targets: [icon1,icon2],
            alpha: 0.2,
            duration: 750,
            yoyo: true,
            loopDelay: 1000,
            loop: -1
        });

        var w = 300;
        var h = 100;
        var panel = new Panel(UI.getGameWidth()-w,UI.getGameHeight()-h,w,h,'Choose a settlement');
        var txt = panel.addText(10,15,'Click on one of the blinking icons for more information about the corresponding settlement.');
        txt.setWordWrapWidth(w-15,true);
        panel.display();
        panel.displayTexts();

        var w = 350;
        var h = 300;
        var nb = new Panel(UI.getGameWidth()-w,UI.getGameHeight()-h,w,h,'New Beginning');
        var txt = nb.addText(10,15,'New Beginning was the first settlement.');
        txt.setWordWrapWidth(w-15,true);

        icon1.on('pointerdown',function(){
            panel.hide();
            panel.hideTexts();
            nb.display();
            nb.displayTexts();
        });

    },

    selectClass: function(name){
        console.log('selecting',name);
        UI.selectedClass = name; // TODO: pass as scene data instead
        UI.sceneTransition('class');
    },

    sceneTransition: function(from){
        var fadeDuration = 500;
        if(from == 'title'){
            fadeDuration = 200;
        }else if(from == 'class'){
            UI.classMenu.hide();
        }
        var camera = UI.scene.cameras.main;
        camera.fade(fadeDuration);
        setTimeout(function(){
            UI.scene.scene.shutdown('boot');
            UI.scene.scene.launch('main');
        },fadeDuration);
    }

};
