/**
 * Created by Jerome on 07-10-17.
 */

function Menu(title){
    this.container = [];
    this.panels = {};
    this.events = {};
    this.hideOnOpen = {};
    this.displayed = false;
    if(title) {
        this.makeTitle(title);
        this.name = title;
    }
}

Menu.prototype.makeTitle = function(title){
    this.title = new UIHolder(945,15,'right','big',this.scene);
    this.title.setButton(this.hide.bind(this));
    this.title.setText(title);
};

Menu.prototype.setTitlePos = function(y){
    this.titleY = y;
};

Menu.prototype.setExitPos = function(x){
    this.exitX = x;
};

Menu.prototype.setSound = function(sound){
    this.sound = sound;
};

Menu.prototype.addPanel = function(name,panel,hideOnOpen){
    this.panels[name] = panel;
    panel.name = name;
    this.hideOnOpen[name] = !!hideOnOpen;
    return panel;
};

Menu.prototype.displayPanel = function(name){
    if(!this.panels.hasOwnProperty(name)) return;
    this.panels[name].display();
    return this.panels[name];
};

Menu.prototype.isPanelDisplayed = function(name){
    if(!this.panels.hasOwnProperty(name)) return false;
    return this.panels[name].displayed;
};
Menu.prototype.hidePanel = function(name){
    if(!this.panels.hasOwnProperty(name)) return;
    this.panels[name].hide();
};

Menu.prototype.addEvent = function(name,callback){
    this.events[name] = callback;
};

Menu.prototype.trigger = function(event){
    if(this.events[event]) this.events[event]();
};

Menu.prototype.setIcon = function(icon){
    this.icon = icon;
};

Menu.prototype.displayIcon = function(){
    if(this.icon) this.icon.display();
};

Menu.prototype.hideIcon = function(){
    if(this.icon) this.icon.hide();
};

Menu.prototype.display = function(){
    if(Engine.inMenu) Engine.currentMenu.hide();
    if(Engine.inPanel) Engine.currentPanel.hide();
    if(Engine.chatBar && Engine.chatBar.displayed) Engine.chatBar.hide();
    if(Engine.player.moving) Engine.player.selfStop();

    if(!Engine.inBuilding && this.title) this.title.display();
    if(this.sound) this.sound.play();

    Engine.currentMenu = this;
    for(var p in this.panels){
        if(!this.panels.hasOwnProperty(p)) continue;
        if(!this.hideOnOpen[p]) this.panels[p].display();
    }

    this.trigger('onOpen');

    Engine.inMenu = true;
    if(!this.allowWalk) Engine.hideMarker();
    if(!this.keepHUD) Engine.hideHUD();
    UI.setCursor();
    this.displayed = true;

    if(this.log) Client.logMenu(this.name);

    if(Client.tutorial && this.hook) TutorialManager.triggerHook('menu:'+this.hook);
};

Menu.prototype.hide = function(){
    if(this.title) this.title.hide();

    for(var panel in this.panels){
        if(!this.panels.hasOwnProperty(panel)) continue;
        this.panels[panel].hide();
    }

    this.trigger('onClose');

    Engine.inMenu = false;
    Engine.currentMenu = null;
    Engine.showMarker();
    if(!this.keepHUD) Engine.displayHUD();
    this.displayed = false;
};

Menu.prototype.toggle = function(){
    if(this.displayed){
        this.hide();
    }else{
        this.display();
    }
};

function BuildingTitle(x,y){
    this.slices = [];
    this.width = 1;
    this.width_ = this.width; // previous width
    this.y = y;

    var sliceWidth, sliceHeight, fontSize, leftFrame, middleFrame, rightFrame, yOffset, xOffset;
    sliceWidth = 49;
    sliceHeight = 63;
    fontSize = 32;
    yOffset = 5;
    xOffset = -5;
    leftFrame = 'woodtitle_left';
    middleFrame = 'woodtitle_middle';
    rightFrame = 'woodtitle_right';
    this.depth = 1;
    this.align = 'center';

    var xl, yl, xm, ym, xr, yr;
    yl = ym = yr = y;
    xm = x;
    xl = xm - sliceWidth;
    xr = xm;

    var textX = x + xOffset;
    var textY = y + yOffset + 10;

    this.text = UI.scene.add.text(textX, textY, '', { font: fontSize+'px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });

    this.slices.push(UI.scene.add.sprite(xl,yl,'UI',leftFrame));
    this.slices.push(UI.scene.add.tileSprite(xm,ym,this.width,sliceHeight,'UI',middleFrame));
    this.slices.push(UI.scene.add.sprite(xr,yr,'UI',rightFrame));

    this.slices.forEach(function(e){
        e.setDepth(this.depth);
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setVisible(false);

        /*e.setInteractive();
        e.on('pointerover',function(){
            UI.manageCursor(1,'UI');
        });
        e.on('pointerout',function(){
            UI.manageCursor(0,'UI');
        });*/
    },this);

    // this.exit = UI.scene.add.sprite(xr+10,yr+10,'UI','exit_icon');
    this.exit = UI.scene.add.sprite(0,yr+10,'UI','exit_icon');
    this.exit.setDepth(this.depth+1);
    this.exit.setScrollFactor(0);
    this.exit.setVisible(false);
    this.exit.setInteractive();
    this.exit.setOrigin(0);
    this.exit.on('pointerdown',Engine.leaveBuilding);
    var exit_ = this.exit;
    this.exit.on('pointerover',function(){
        exit_.setFrame('exit_icon_on');
    });
    this.exit.on('pointerout',function(){
        exit_.setFrame('exit_icon');
    });

    this.invrect = UI.scene.add.image(1024,0,'UI','invisible');
    this.invrect.setInteractive();
    this.invrect.setScrollFactor(0);
    this.invrect.setOrigin(0.5);

    this.text.setDepth(this.depth+1);
    this.text.setScrollFactor(0);
    /*if(this.align == 'right'){
        this.text.setOrigin(1,0);
    }else if(this.align == 'center'){
        this.text.setOrigin(0.5,0);
    }*/
    this.text.setOrigin(0.5,0);
    this.text.setVisible(false);

    this.addCapsule('owner',0,-5,'John Doe\'s');
}

BuildingTitle.prototype.addCapsule = function(name,x,y,text,icon){
    var capsule = new Capsule(this.slices[0].x+x,this.slices[0].y+y,'UI',icon,this.content);
    capsule.setText(text);
    this.capsule = capsule;
};

BuildingTitle.prototype.setText = function(text){
    this.text.setText(text);
    //var w = (this.style == 'big' ? Math.max(this.text.width,150) : this.text.width);
    var w  = this.text.width;
    this.resize(w);
};

BuildingTitle.prototype.resize = function(w){
    var left = this.slices[0];
    var middle = this.slices[1];
    var right = this.slices[2];
    var delta = this.width-w;

    left.x += Math.floor(delta/2);
    middle.x += Math.floor(delta/2);
    right.x -= Math.floor(delta/2);
    this.exit.x -= Math.floor(delta/2);
    middle.width -= delta;
    if(middle.width%2 != 0) middle.width++;
    this.capsule.move(Math.floor(delta/2),0);

    this.width = w;
    this.width_ = this.width;
};

BuildingTitle.prototype.display = function(){
    this.slices.forEach(function(e){
        e.setVisible(true);
    });
    this.text.setVisible(true);
    this.exit.x = Engine.currentMenu.exitX;
    this.exit.setVisible(true);
    this.invrect.setPosition(this.exit.x,this.exit.y);
    this.capsule.display();
};

BuildingTitle.prototype.hide = function(){
    this.slices.forEach(function(e){
        e.setVisible(false);
    });
    this.text.setVisible(false);
    this.exit.setVisible(false);
    this.capsule.hide();
};

BuildingTitle.prototype.move = function(y){
    var dy = y - this.y;
    this.slices.forEach(function(e){
        e.y += dy;
    });
    this.text.y += dy;
    this.exit.y += dy;
    this.capsule.move(0,dy);
    this.y = y;
};