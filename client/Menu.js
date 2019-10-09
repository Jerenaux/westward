/**
 * Created by Jerome on 07-10-17.
 */
import Client from './Client'
import Engine from './Engine'
import UI from './UI'
import UIHolder from './UIHolder'

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

Menu.prototype.beforeAll = function(cb){
    this.beforeAllCb = cb;
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
    if(UI.inPanel) UI.currentPanel.hide();
    if(Engine.chatBar && Engine.chatBar.displayed) Engine.chatBar.hide();
    if(Engine.player.moving) Engine.player.selfStop();

    if(!Engine.inBuilding && this.title) this.title.display();
    if(this.sound) this.sound.play();

    Engine.currentMenu = this;
    if(this.beforeAllCb) this.beforeAllCb.call();
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
    console.warn('Hiding ',this.name);
    if(this.title) this.title.hide();

    for(var panel in this.panels){
        if(!this.panels.hasOwnProperty(panel)) continue;
        this.panels[panel].hide();
    }
    if(Engine.repairPanel.displayed) Engine.repairPanel.hide();

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

export default Menu