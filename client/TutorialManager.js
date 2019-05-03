/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 28-04-19.
 */

var TutorialManager = {};

TutorialManager.update = function(){
    Engine.player.updateData(TutorialManager.tutorialData.playerData); // Data to simulate player setup
    Engine.updateWorld(TutorialManager.tutorialData.worldData);     // Data to create tutorial world
};

TutorialManager.boot = function(part,chaining){
    /*if(!Object.keys(Engine.scene.cache.json.get('tutorials')).includes('part'+part)) return;
    if(chaining){
        TutorialManager.tutorialData = Engine.scene.cache.json.get('tutorials')['part' + part];
        TutorialManager.update();
    }else{
        TutorialManager.tutorialData = Engine.scene.cache.json.get('tutorials')['part1'];
        Engine.initWorld(TutorialManager.tutorialData.initData); // Data to simulate init package from server

        for(var p = 1; p <= part; p++) {
            TutorialManager.tutorialData = Engine.scene.cache.json.get('tutorials')['part' + p];
            TutorialManager.update();
        }
    }*/
    TutorialManager.tutorialData = Engine.scene.cache.json.get('tutorials')['part' + part];
    TutorialManager.currentPart = part;
    TutorialManager.nextTutorial = 0;
    TutorialManager.currentHook = null;
    TutorialManager.displayNext();
    Client.sendTutorialStart();
};

TutorialManager.displayNext = function(){
    if(Engine.currentTutorialPanel) Engine.currentTutorialPanel.hide();

    var i = TutorialManager.nextTutorial++;
    if(i >= TutorialManager.tutorialData.length){
        Client.sendTutorialEnd(TutorialManager.currentPart);
        TutorialManager.boot(TutorialManager.currentPart+1,true);
        return;
    };
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
    // }else if(!step.camera && i > 0 && step[i-1].camera){
    }else{
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
    panel.addText(x,y,step.txt);

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
TutorialManager.isHookTriggered = function(){
    if(!TutorialManager.currentHook) return false;
    var info = TutorialManager.currentHook.split(':');
    if(info[0] == 'stock'){
        if(Engine.buildings[info[1]].getItemNb(info[2]) == info[3]) return true;
    }
    return false;
};

TutorialManager.triggerHook = function(hook){
    if(TutorialManager.currentHook == hook) TutorialManager.displayNext();
};

// Called when a player builds something in the tutorial
TutorialManager.build = function(x,y,type){
    var items = [];
    if(type == 6) items.push([3,5]); //TODO: conf?
    Engine.updateWorld({newbuildings:[{id:3,type:type,built:true,x:x,y:y,items:items,owner:Engine.player.id}]});
};

// Called when a player changes the stock of a building in the tutorial;
// mimicks what the server would do
TutorialManager.handleStock = function(action,item,nb){
    // TODO: Make all this much more declarative
    // Update the building stock
    if(action == 'give') nb *= -1;
    var newnb = Engine.currentBuiling.getItemNb(item)-nb;
    var items = [[parseInt(item),newnb]];
    var updt = {buildings:{}};
    updt.buildings[Engine.currentBuiling.id] = {items:items};

    // Update player inventory
    items = [];
    items.push([parseInt(item),Engine.player.getItemNb(item)+nb]);
    var sign = (nb > 0 ? '+' : '');
    Engine.player.updateData(
        {items:items,
            notifs:[sign+nb+' '+Engine.itemsData[item].name]} // TODO: centralize notifs
    );

    // Update gold
    var price = Engine.currentBuiling.getPrice(item,'sell');
    if(price){
        Engine.player.updateData(
            {gold:Engine.player.gold-price} // TODO: centralize notifs
        );
        updt.buildings[Engine.currentBuiling.id]['gold'] = Engine.currentBuiling.gold + price;
    }

    console.warn(updt);
    Engine.updateWorld(updt);

    TutorialManager.triggerHook('stock:'+Engine.currentBuiling.id+':'+item+':'+newnb);

    if(action == 'give'){
        // TODO: call a Building method to check if building ready to build or not
        var recipe = Engine.buildingsData[Engine.currentBuiling.buildingType].recipe;
        if(newnb >= recipe[item]){
            var updt = {buildings:{}};
            updt.buildings[Engine.currentBuiling.id] = {built:true};
            Engine.updateWorld(updt);
        }
    }
};
