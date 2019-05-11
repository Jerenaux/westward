/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 28-04-19.
 */

var TutorialManager = {};

TutorialManager.update = function(){
    Engine.player.updateData(TutorialManager.tutorialData.playerData); // Data to simulate player setup
    Engine.updateWorld(TutorialManager.tutorialData.worldData);     // Data to create tutorial world
};

TutorialManager.boot = function(part){
    TutorialManager.tutorialData = Engine.scene.cache.json.get('tutorials');
    TutorialManager.currentPart = part;
    TutorialManager.nextTutorial = 31;
    TutorialManager.currentHook = null;
    Client.sendTutorialStart();
    TutorialManager.displayNext();
};

TutorialManager.displayNext = function(){
    if(Engine.currentTutorialPanel) Engine.currentTutorialPanel.hide();

    var i = TutorialManager.nextTutorial++;
    Client.sendTutorialStep(i);
    if(i >= TutorialManager.tutorialData.steps.length) return;
    TutorialManager.currentHook = null;

    var steps = TutorialManager.tutorialData.steps;
    var step = steps[i];
    var pos = step.pos;
    var j = 0;
    // If the current spec doesn't indicate a position, loop backwards until you find one
    while(pos === null){
        pos = steps[i-j++].pos;
    }

    if(step.hook) TutorialManager.currentHook = step.hook;
    if(TutorialManager.isHookTriggered()){
        TutorialManager.displayNext();
        return;
    }

    // Keep = keep it centered elsewhere than player
    if(step.camera && step.camera != 'keep') {
        Engine.camera.stopFollow();
        Engine.camera.pan(step.camera[0] * 32, step.camera[1] * 32);
    }else if(!step.camera && i > 0 && steps[i-1].camera){
    // }else{
        Engine.camera.pan(Engine.player.x,Engine.player.y,1000,'Linear',false,function(camera,progress){
            if(progress == 1) Engine.camera.startFollow(Engine.player);
        });
    }

    var x = pos[0];
    var y = pos[1];
    var w = pos[2];
    var h = pos[3];
    if(x == 'c') x = (UI.getGameWidth() - w) / 2;
    if(y == 'c') y = (UI.getGameHeight() - h) / 2;
    var panel = new InfoPanel(x, y, w, h, 'Tutorial');
    panel.setWrap(30);

    var x = 15;
    var y = 20;

    var text = step.txt;

    var itemRe = /\[I([0-9]+)\]/g;
    var buildingRe = /\[B([0-9]+)\]/g;
    while((match = itemRe.exec(text)) !== null){
        text = text.replace(/\[I[0-9]+\]/,Engine.itemsData[match[1]].name);
    }
    while((match = buildingRe.exec(text)) !== null){
        text = text.replace(/\[B[0-9]+\]/,Engine.buildingsData[match[1]].name);
    }

    panel.addText(x,y,text);

    if(!step.hook){
        panel.addBigButton('Next', TutorialManager.displayNext);
        panel.handleKeyboard = function(event){
            if(['Enter',' '].includes(event.key)) panel.button.handleClick();
        };
    }

    panel.display();
    panel.moveUp(5);
    Engine.currentTutorialPanel = panel;
    Engine.inPanel = false;
};

// Check if the current hook is already triggered
TutorialManager.isHookTriggered = function(hook){
    hook = hook || TutorialManager.currentHook;
    if(!hook) return false;
    var info = hook.split(':');
    switch(info[0]){
        case 'area':
            var area = new Phaser.Geom.Rectangle(parseInt(info[1]),parseInt(info[2]),parseInt(info[3]),parseInt(info[4]));
            return area.contains(Engine.player.tileX,Engine.player.tileY);
        case 'bld':
            return (Engine.currentBuiling && Engine.currentBuiling.id == info[1]);
        case 'bldselect':
            return TutorialManager.isHookTriggered('newbuilding:'+hook[1]);
        case 'built':
            return Engine.buildings[info[1]].isBuilt();
        case 'exit':
            return Engine.currentBuiling == null;
        case 'inventory':
            return Engine.player.getItemNb(info[1]) >= info[2];
        case 'menu':
            return (Engine.currentMenu && Engine.currentMenu.hook == info[1]);
        case 'newbuilding':
            for(var bldid in Engine.buildings){
                var building = Engine.buildings[bldid];
                if(building.buildingType == info[1] && building.isOwned()) return true;
            }
            return false;
        case 'stock':
            return (Engine.buildings[info[1]].getItemNb(info[2]) == info[3]);
    }
    return false;
};

TutorialManager.checkHook = function(){
    if(TutorialManager.isHookTriggered()) TutorialManager.displayNext();
};

TutorialManager.triggerHook = function(hook){
    if(TutorialManager.currentHook == hook) TutorialManager.displayNext();
};
