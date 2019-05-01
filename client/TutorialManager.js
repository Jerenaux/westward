/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 28-04-19.
 */

var TutorialManager = {};

TutorialManager.boot = function(part){
    // Data to simulate init package from server
    var initData = { // TODO: move to conf
        id: 0,
        x: 1211,
        y: 160,
        settlement: 1
    };
    // Data to simulate player setup
    var playerData = { // TODO: conf
        gold: 100,
        stats: [{k:'hpmax',v:300},{k:'hp',v:300}],
        bldRecipes: [11,6,3,4]
    };
    // Data to create tutorial world
    var worldData = {
        'newbuildings':[
            {id:0,type:11,x:1203,y:156,built:true,ownerName:'Roger'},
            {id:1,type:11,x:1199,y:153,built:true,ownerName:'Tom'},
            {id:2,type:3,x:1189,y:159,built:false,items:[[3,15],[26,10]],ownerName:'Joe'}
        ]
    };

    Engine.initWorld(initData);
    Engine.player.updateData(playerData);
    Engine.updateWorld(worldData);

    TutorialManager.tutorialData = Engine.scene.cache.json.get('tutorials')[part];
    TutorialManager.nextTutorial = 15;
    TutorialManager.currentHook = null;
    TutorialManager.displayNext();
    Client.sendTutorialStart();
};

TutorialManager.displayNext = function(){
    if(Engine.currentTutorialPanel) Engine.currentTutorialPanel.hide();

    var i = TutorialManager.nextTutorial++;
    if(i >= TutorialManager.tutorialData.length) return;
    TutorialManager.currentHook = null;

    var specs = TutorialManager.tutorialData;
    var spec = specs[i];
    var pos = spec.pos;
    var j = 0;
    // If the current spec doesn't indicate a position, loop backwards until you find one
    while(pos === null){
        pos = specs[i-j++].pos;
    }

    if(spec.hook) TutorialManager.currentHook = spec.hook;
    if(TutorialManager.isHookTriggered()){
        TutorialManager.displayNext();
        return;
    }

    if(spec.camera && spec.camera != 'keep') {
        Engine.camera.stopFollow();
        Engine.camera.pan(spec.camera[0] * 32, spec.camera[1] * 32);
    }else if(!spec.camera && i > 0 && specs[i-1].camera){
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
    panel.addText(x,y,spec.txt);

    if(!spec.hook){
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
    Engine.updateWorld({newbuildings:[{id:4,type:type,built:true,x:x,y:y,items:items,owner:Engine.player.id}]});
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
    Engine.updateWorld(updt);

    // Update player inventory
    items = [];
    items.push([parseInt(item),Engine.player.getItemNb(item)+nb]);
    var sign = (nb > 0 ? '+' : '');
    Engine.player.updateData(
        {items:items,
            notifs:[sign+nb+' '+Engine.itemsData[item].name]} // TODO: centralize notifs
    );

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
