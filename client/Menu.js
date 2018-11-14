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

Menu.prototype.setSound = function(sound){
    this.sound = sound;
};

Menu.prototype.addPanel = function(name,panel,hideOnOpen){
    this.panels[name] = panel;
    panel.name = name;
    this.hideOnOpen[name] = !!hideOnOpen;
    return panel;
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

    for(var event in this.events){
        if(!this.events.hasOwnProperty(event)) continue;
        this.trigger(event);
    }

    Engine.inMenu = true;
    Engine.hideMarker();
    Engine.hideHUD();
    UI.setCursor();
    this.displayed = true;

    if(Client.tutorial && this.hook) Engine.tutorialHook(this.hook);
};

Menu.prototype.hide = function(){
    if(this.title) this.title.hide();

    for(var panel in this.panels){
        if(!this.panels.hasOwnProperty(panel)) continue;
        this.panels[panel].hide();
    }

    Engine.inMenu = false;
    Engine.currentMenu = null;
    Engine.showMarker();
    Engine.displayHUD();
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

    var sliceWidth, sliceHeight, fontSize, leftFrame, middleFrame, rightFrame, yOffset, xOffset;
    sliceWidth = 49;
    sliceHeight = 63;
    fontSize = 32;
    yOffset = 5;
    xOffset = -5;
    leftFrame = 'woodtitle_left';
    middleFrame = 'woodtitle_middle';
    rightFrame = 'woodtitle_right';
    this.depth = 2;
    this.align = 'center';

    var xl, yl, xm, ym, xr, yr;
    yl = ym = yr = y;
    xm = x;
    xl = xm - sliceWidth;
    xr = xm;

    var textX = x + xOffset;
    var textY = y + yOffset;

    this.text = UI.scene.add.text(textX, textY, '', { font: fontSize+'px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });

    console.log(xl,yl,xm,ym,xr,yr);
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

    this.text.setDepth(this.depth+1);
    this.text.setScrollFactor(0);
    /*if(this.align == 'right'){
        this.text.setOrigin(1,0);
    }else if(this.align == 'center'){
        this.text.setOrigin(0.5,0);
    }*/
    this.text.setOrigin(0.5,0);
    this.text.setVisible(false);
}

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

    if(this.align == 'right'){
        left.x += delta;
        middle.x += delta;
    }else if(this.align == 'center'){
        left.x += Math.floor(delta/2);
        middle.x += Math.floor(delta/2);
        right.x -= Math.floor(delta/2);
    }
    middle.width -= delta;

    this.width = w;
    this.width_ = this.width;
};

BuildingTitle.prototype.display = function(){
    this.slices.forEach(function(e){
        e.setVisible(true);
    });
    this.text.setVisible(true);
};

BuildingTitle.prototype.hide = function(){
    this.slices.forEach(function(e){
        e.setVisible(false);
    });
    this.text.setVisible(false);
};
