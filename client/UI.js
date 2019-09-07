/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 14-03-18.
 */
import BattleManager from './BattleManager'
import Boot from './Boot';
import Bubble from './Bubble'
import ClassPanel from './ClassPanel'
import Client from './Client'
import Engine from './Engine'
import InfoPanel from './InfoPanel'
import Menu from './Menu'
import NamePanel from './NamePanel'
import {Stats} from '../shared/Stats'
import Tooltip from './Tooltip'
import UICursor from './UICursor'
import UIHolder from './UIHolder'
import Utils from '../shared/Utils'

var UI = {
    key: 'UI',
    plugins: ['Clock', 'DataManagerPlugin', 'InputPlugin', 'Loader', 'TweenManager', 'LightsPlugin'],
    tooltipDepth: 20,

    preload: function () {
        UI.scene = this;
        this.input.setGlobalTopOnly(true); // Prevent clicks from bubbling down to game scene

        this.load.json('ui-frames', 'assets/sprites/ui.json'); // load frame data separately for use in CSS
        this.load.atlas('UI', 'assets/sprites/ui.png', 'assets/sprites/ui.json');
        this.load.atlas('banners', 'assets/sprites/stlbanner.png', 'assets/sprites/stlbanner.json');

        this.load.json('texts', 'assets/data/texts.json');
        this.load.json('classes', 'assets/data/classes.json');
        this.load.json('badwords', 'assets/misc/swearWords.json');

        this.load.audio('click', 'assets/sfx/click.wav');
        this.load.audio('error', 'assets/sfx/error.wav');

        this.load.html('tooltip', '/assets/html/tooltip.html');

        this.load.atlas('cursors', 'assets/sprites/cursors.png', 'assets/sprites/cursors.json');

        if (Client.isNewPlayer()) {
            this.load.image('bigbg', 'assets/sprites/bigbg.png');
            this.load.image('bigbg_mask', 'assets/sprites/bigbg_mask.png');
            this.load.image('worldmap', 'maps/worldmap.png');
            // this.load.image('campdiamond', 'assets/sprites/camp_diamond.png');
            this.load.image('setldiamond', 'assets/sprites/setl_diamond.png');
            this.load.image('wood', 'assets/sprites/wood.jpg');
        }
    },

    create: function () {
        this.scene.bringToTop();

        UI.gatherStatsFrames();
        UI.tooltip = new Tooltip();
        UI.camera = UI.scene.cameras.main;
        UI.notifications = [];
        UI.textsData = this.cache.json.get('texts');
        UI.classesData = this.cache.json.get('classes');


        UI.scene.sys.game.canvas.style.cursor = 'none';
        UI.cursor = new UICursor();
        UI.setCursor();

        UI.hovering = [];
        UI.hoverFlower = 0;

        this.input.setTopOnly(false);
        this.input.on('pointermove', function (event) {
            if (UI.tooltip) UI.tooltip.updatePosition(event.x, event.y);

            // Add custom cursor sprite to mouse cordinates
            if (UI.cursor) UI.cursor.setPosition(event.x, event.y);
        });
        if (Client.isNewPlayer()) UI.classMenu = UI.makeClassMenu();

        this.input.keyboard.on('keydown', UI.handleKeyboard);
        this.currentView = 'title';

        this.scene.get('boot').updateReadyTick();

        //Auto start game for dev reasons
        if (Client.gameConfig.boot.autoBoot) UI.launchGameMode();


    },

    makeBattleTutorialPanel: function () {
        var h = 200;
        var w = 200;
        var y = UI.getGameHeight() - h;
        var panel = new InfoPanel(0, y, w, h, 'Battle tutorial');
        panel.addText(UI.textsData['battle_help']);
        panel.addBigButton('Got it');
        return panel;
    }

};

UI.gatherStatsFrames = function () {
    UI.framesData = UI.scene.cache.json.get('ui-frames');
    var frames = [];
    UI.statsFrames = {};
    for (var stat in Stats) {
        var frame = Stats[stat].frame;
        if (frame) frames.push(frame);
    }
    UI.framesData['frames'].forEach(function (frame) {
        if (frames.includes(frame.filename)) UI.statsFrames[frame.filename] = frame.frame;
    });
};

UI.handleKeyboard = function (event) {
    //console.log(event);
    if (Engine.playerIsInitialized) {
        if (event.key == 'Enter') Engine.toggleChatBar();
    } else {
        switch (UI.scene.currentView) {
            case 'title':
                if (['Enter', ' '].includes(event.key)) UI.launchGameMode();
                break;
            case 'name':
                if (event.key == 'Enter') UI.validatePlayerName();
                break;
            default:
                break;
        }
    }
};

UI.handleNotifications = function (msgs) {
    if (UI.runningNotifications) {
        setTimeout(UI.handleNotifications, UI.runningNotifications * 10, msgs);
        return;
    }
    // TODO: add to localstorage for display in character panel
    var notifs = [];
    var padding = 10;
    var totalHeight = padding;
    msgs.forEach(function (msg) {
        var notif = new Bubble(0, 0, true); // TODO: use pool (separate speech bubbles from notifs)
        notif.update(msg);
        totalHeight += (notif.getHeight() + padding);
        notifs.push(notif);
    });
    UI.notifications = UI.notifications.filter(function (notif) {
        return notif.displayed;
    });
    UI.notifications.forEach(function (notif) {
        UI.scene.tweens.addCounter({
            from: notif.y,
            to: notif.y - totalHeight,
            duration: 300,
            ease: 'Quad.easeOut',
            onUpdate: function (tween) {
                notif.updatePosition(notif.x, tween.getValue());
            }
        });
    });
    var cumulativeHeight = 0;
    notifs.forEach(function (notif, i) {
        UI.showNotification(notif, i, cumulativeHeight);
        cumulativeHeight += notif.getHeight() + padding;
    });
    //console.log('total time = ',300+(msgs.length-1)*50);
};

UI.runningNotifications = 0;
UI.showNotification = function (notif, i, height) {
    var x = (UI.getGameWidth() - notif.getWidth()) / 2 - notif.getOrigin();
    var y = UI.getGameHeight();
    notif.updatePosition(x, y);

    var endy = y - height - 50;
    if (BattleManager.inBattle) endy -= 70;
    notif.endy = endy;
    var tween = UI.scene.tweens.addCounter({
        from: y,
        to: endy,
        duration: 300,
        paused: true,
        ease: 'Quad.easeOut',
        onStart: function () {
            UI.runningNotifications++;
            notif.display();
        },
        onUpdate: function (tween) {
            notif.updatePosition(x, tween.getValue());
        },
        onComplete: function () {
            //console.log('done at ',Date.now());
            UI.runningNotifications--;
        }
    });

    var delay = i * 50;
    setTimeout(function () {
        tween.play();
    }, delay);
    UI.notifications.push(notif);
};

UI.getConfig = function () {
    return this.scene.sys.game.config;
};

UI.getGameWidth = function () {
    return UI.getConfig().width;
};

UI.getGameHeight = function () {
    return UI.getConfig().height;
};

UI.manageCursor = function (inout, type, target) {

    if (target) {

        if (target.entityType == 'cell' && Engine.cursorOnTarget) return;

        Engine.cursorOnTarget = (target.entityType != 'cell');
        target.setCursor();
    } else {
        UI.setCursor();
    }
    /*var data = {
        type: type,
        target: target
    };
    var hovering = UI.hovering.last() || {type:'ground'};

    if(inout == 1){
        if(hovering.type == 'sticky') return; // don't change cursor if currently sticky
        if(type == 'tile' && (hovering.type == 'npc')) return;
        UI.hovering.push(data);
    }else{
        if(type != hovering.type) return;
        UI.hovering.pop();
    }

    var hovering = UI.hovering.last() || {type:'ground'};
    //console.log('hovering : ',hovering.type);
    if(hovering.type == 'sticky'){
        UI.setCursor('bomb');
    }else if(hovering.type == 'UI'){
        UI.setCursor();
    }else if(hovering.type != 'UI' && hovering.type != 'ground' && hovering.type != 'tile') {
        hovering.target.setCursor();
    }else if(hovering.type == 'tile'){
        //UI.setCursor('move');
        UI.setCursor();
    }else if(hovering.type == 'ground'){
        if(Engine.inMenu){
            UI.setCursor();
        }else {
            UI.setCursor('move');
        }
    }*/
};

UI.downCursor = function () {
    // if (UI.dualCursors.includes(UI.currentCursor)) UI.setCursor(UI.currentCursor, true);
    UI.cursor.down();
};

UI.upCursor = function () {
    // UI.setCursor(UI.currentCursor);
    UI.cursor.up();
};

/**
 * Change the appearance of the cursor based on what it's hovering
 * @param {string} cursor - key of the frames dict of the cursor to display;
 * if nothing, then displays default one
 */
UI.setCursor = function (cursor) {
    // var cursorFile = UI.cursors[cursor || 'default'];
    // UI.scene.sys.game.canvas.style.cursor = 'url(/assets/sprites/cursors/'+cursorFile+(down ? '2' : '')+'.png), auto';
    // UI.currentCursor = cursor;
    UI.cursor.changeCursor(cursor);
};

UI.makeClassMenu = function () {
    var title = new UIHolder(512, 10, 'center');
    title.setText(UI.textsData['class_selection_title']);

    var menu = new Menu();
    var desch = 60;
    var classw = 400;
    var classh = 195;
    var padding = 20;
    var tlx = 1024 / 2 - classw - padding;
    var y = 80;
    var x = tlx;
    menu.addPanel('title', title);
    var infow = (2 * classw) + padding;
    var info = menu.addPanel('info', new InfoPanel(x, y, infow, desch));
    info.addText(10, 10, UI.textsData['class_selection'], Utils.colors.white, 14, Utils.fonts.normal);
    y += desch + padding;

    var i = 0;
    for (var classID in UI.classesData) {
        this.makeClassPanel(menu, classID, x, y, classw, classh);
        x += classw + padding;
        if (++i == 2) {
            i = 0;
            x = tlx;
            y += classh + padding;
        }
    }

    return menu;
};

UI.makeClassPanel = function (menu, classID, x, y, classw, classh) {
    var classData = UI.classesData[classID];
    var panel = menu.addPanel('class_' + classID, new ClassPanel(x, y, classw, classh, classData.name));
    panel.setClass(classID);
};

UI.launchGameMode = function () {
    if (UI.gameLaunched) return;
    UI.gameLaunched = true;
    Boot.buttons.forEach(function (b) {
        b.hide();
    });
    UI.scene.tweens.add({
        targets: Boot.titleBg,
        alpha: 0,
        duration: 1000
    });
    UI.scene.tweens.add({
        targets: Boot.title,
        alpha: 0,
        duration: 1000,
        onComplete: function () {
            if (Client.isNewPlayer()) {
                //UI.displayClassMenu();
                //UI.displaySettlementSelectionMenu();
                UI.displayNameBox();
            } else {
                UI.camera.fadeOut(500);
                UI.camera.once('camerafadeoutcomplete', function () {
                    Client.tutorial = false;
                    UI.launchGame();
                    UI.camera.fadeIn(500);
                });
            }
        }
    });
};

UI.launchTutorialMode = function () {
    Boot.buttons.forEach(function (b) {
        b.hide();
    });
    UI.scene.tweens.add({
        targets: Boot.titleBg,
        alpha: 0,
        duration: 1000
    });
    UI.scene.tweens.add({
        targets: Boot.title,
        alpha: 0,
        duration: 1000,
        onComplete: function () {
            UI.camera.fadeOut(500);
            UI.camera.once('camerafadeoutcomplete', function () {
                Client.tutorial = true;
                UI.launchGame();
                UI.camera.fadeIn(500);
            });
        }
    });
};

UI.displayClassMenu = function () {
    UI.classMenu.display();
};

UI.selectClass = function (id) {
    UI.selectedClass = id;
    UI.camera.fadeOut(500);
    UI.camera.once('camerafadeoutcomplete', function () {
        UI.classMenu.hide();
        Boot.background.setVisible(false);
        UI.displaySettlementSelectionMenu();
        UI.camera.fadeIn(500);
    });
};

UI.displayNameBox = function () {
    UI.scene.currentView = 'name';
    var panel = new NamePanel(362, 150, 300, 140, 'Character name');
    panel.addText(10, 20, 'Enter the name of your character.');
    panel.addBigButton('Next', UI.validatePlayerName);
    panel.display();
    UI.namePanel = panel;
};

UI.validatePlayerName = function () {
    var badwords = UI.scene.cache.json.get('badwords');
    var name = UI.namePanel.getValue().toLowerCase();
    if (badwords.includes(name)) {
        UI.namePanel.displayError();
    } else {
        UI.displayRegionSelectionMenu();
    }
};

UI.displayRegionSelectionMenu = function () {
    UI.scene.currentView = 'region';
    if (UI.namePanel) {
        UI.characterName = UI.namePanel.getValue();
        if (!UI.characterName) return;
        UI.namePanel.hide();
    }
    var content = [];
    content.push(UI.scene.add.image(0, 0, 'wood').setOrigin(0));
    var scroll = UI.scene.add.image(UI.getGameWidth() / 2, UI.getGameHeight() / 2, 'bigbg');
    content.push(scroll);
    var map = UI.scene.add.image(UI.getGameWidth() / 2, UI.getGameHeight() / 2, 'worldmap');
    content.push(map);
    //map.x += 50;
    map.y += 120;
    map.setScale(0.4);

    if (Boot.WEBGL) {
        var mask = UI.scene.add.sprite(scroll.x, scroll.y, 'bigbg_mask');
        mask.setVisible(false);
        map.setMask(new Phaser.Display.Masks.BitmapMask(UI.scene, mask));
    } else {
        scroll.setScale(1.4);
    }

    UI.SSmap = map;
    UI.SScontent = content;
    Client.requestRegionsData();
    //Client.requestCampsData();

    var w = 400;
    var h = 220;
    var panel = new InfoPanel((UI.getGameWidth() - w) / 2, (UI.getGameHeight() - h) / 2, w, h, 'Region selection');
    panel.addText(10, 15, UI.textsData['settlement_intro'], null, 14, Utils.fonts.normal);
    panel.addBigButton('Got it');
    panel.display();
    UI.SSpanel = panel;

};

UI.displayRegions = function (list) {
    for (var e in list.regions) {
        UI.displayRegion(list.regions[e], list.world);
    }
};

UI.displayRegion = function (data, world) {
    console.log(data);
    var x = (data.x / world.width) * UI.SSmap.width * UI.SSmap.scaleX - 90; // why offset?
    var y = (data.y / world.height) * UI.SSmap.height * UI.SSmap.scaleY - 50;
    var icon = UI.scene.add.image(x, y, 'setldiamond');
    icon.setOrigin(0.5, 1);
    icon.setInteractive();
    UI.SScontent.push(icon);

    var t = UI.scene.add.text(x, y + 12, data.name, {
        font: '16px belwe',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    });
    t.setDepth(1).setScrollFactor(0).setOrigin(0.5);
    var w = t.width;
    var bannerx = x - 27 - w / 2;
    var bannery = y;
    UI.SScontent.push(UI.scene.add.image(bannerx, bannery, 'banners', 'left').setInteractive().setOrigin(0));
    UI.SScontent.push(UI.scene.add.tileSprite(bannerx + 21, bannery, w, 24, 'banners', 'middle').setInteractive().setOrigin(0));
    UI.SScontent.push(UI.scene.add.image(bannerx + w + 21, bannery, 'banners', 'right').setInteractive().setOrigin(0));

    UI.SScontent.push(t);

    UI.scene.tweens.add({
        targets: icon,
        alpha: 0.2,
        duration: 750,
        yoyo: true,
        delay: 1000,
        loopDelay: 1000,
        loop: -1
    });

    /*var w = 350;
    var h = 300;
    var panel = new SettlementPanel(UI.getGameWidth()-w,UI.getGameHeight()-h,w,h,data.name);
    panel.setUp(data);*/

    icon.setlID = data.id;

    icon.on('pointerdown', function () {
        if (UI.SSpanel) UI.SSpanel.hide();
        //panel.display();
        //UI.SSpanel = panel;
        UI.selectSettlement(this.setlID);
    }.bind(icon));
    icon.on('pointerover', function () {
        UI.tooltip.updateInfo('free', {title: data.name});
        UI.tooltip.display();
    });
    icon.on('pointerout', function () {
        UI.tooltip.hide();
    });
};

UI.displayCamps = function (list) {
    list.forEach(function (e) {
        UI.displayCamp(e);
    });
};

UI.displayCamp = function (data) {
    var x = data.x * UI.SSmap.width - 50;
    var y = data.y * UI.SSmap.height;
    var icon = UI.scene.add.image(x, y, 'campdiamond');
    icon.setScale(0.6);
    icon.setOrigin(0.5, 1);
    icon.setInteractive();
    icon.on('pointerover', function () {
        UI.tooltip.updateInfo('free', {title: 'Enemy camp'});
        UI.tooltip.display();
    });
    icon.on('pointerout', function () {
        UI.tooltip.hide();
    });
    UI.SScontent.push(icon);
};

UI.selectSettlement = function (id) {
    console.log('Region selected (', id, ')');
    UI.selectedSettlement = id;
    var fadeDuration = 500;
    UI.camera.fadeOut(fadeDuration);
    UI.camera.once('camerafadeoutcomplete', function () {
        UI.SScontent.forEach(function (c) {
            c.setVisible(false);
        });
        UI.SSpanel.hide();
        UI.launchGame();
        UI.camera.fadeIn(fadeDuration);
    });
};

UI.launchGame = function () {
    Boot.background.setVisible(false);
    UI.scene.scene.shutdown('boot');
    UI.scene.scene.launch('game');
};

UI.debugScreen = function () {
    var graphics = UI.scene.add.graphics();
    graphics.setDepth(10);
    graphics.setScrollFactor(0);

    graphics.lineStyle(1, 0x00ff00, 3);

    graphics.beginPath();
    graphics.moveTo(512, 0);
    graphics.lineTo(512, 576);
    graphics.strokePath();
    graphics.closePath();

    graphics.beginPath();
    graphics.moveTo(0, 288);
    graphics.lineTo(1024, 288);
    graphics.strokePath();
    graphics.closePath();

    graphics.beginPath();
    graphics.moveTo(512, 288);
    graphics.lineTo(1024, 576);
    graphics.strokePath();
    graphics.closePath();
};

export default UI