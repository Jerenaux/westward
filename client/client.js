/**
 * Created by Jerome on 30-06-17.
 */

Client = {
    initEventName: 'init', // name of the event that triggers the call to initWorld() and the initialization of the game
    storageIDKey: 'playerID', // key in localStorage of player ID
    eventsQueue : [] // when events arrive before the flag playerIsInitialized is set to true, they are not processed
};

Client.socket = io.connect();

Client.emptyQueue = function(){ // Process the events that have been queued during initialization
    for(var e = 0; e < Client.eventsQueue.length; e++){
        onevent.call(Client.socket,Client.eventsQueue[e]);
    }
};

Client.requestData = function(){ // request the data to be used for initWorld()
    console.log('requesting data');
    Client.socket.emit('init-world',Client.getInitRequest());

    // The following checks if the game is initialized or not, and based on this either queues the events or process them
    // The original socket.onevent function is copied to onevent. That way, onevent can be used to call the origianl function,
    // whereas socket.onevent can be modified for our purpose!
    var onevent = Client.socket.onevent;
    Client.socket.onevent = function (packet) {
        if(!Engine.playerIsInitialized && packet.data[0] != Client.initEventName && packet.data[0] != 'dbError'){
            Client.eventsQueue.push(packet);
        }else{
            onevent.call(this, packet);    // original call
        }
    };
};

Client.getInitRequest = function(){ // Returns the data object to send to request the initialization data
    // In case of a new player, set new to true and send the name of the player
    // Else, set new to false and send it's id instead to fetch the corresponding data in the database
    if(Client.isNewPlayer()) {
        console.log('Requesting data for new player');
        return {
            new:true,
            selectedClass: UI.selectedClass,
            selectedSettlement: UI.selectedSettlement
        };
    }
    return {
        new:false,
        id:Client.getPlayerID(),
        stamp: Client.getIDStamp()
    };
};

Client.getIDStamp = function(){
    return localStorage.getItem('idStamp');
};

Client.getBootParameters = function(){
    Client.socket.emit('boot-params');
};

Client.checkForNewPlayer = function(){
    console.log('Player id:',Client.getPlayerID());
    Client.newPlayer = (Client.getPlayerID() === null);
};

Client.isNewPlayer = function(){
    if(Client.bootParameters.forceNewPlayer) return true;
    return Client.newPlayer;
};

Client.getPlayerID = function(){
    return localStorage.getItem(Client.storageIDKey);
};

Client.isFirstBattle = function(){
    return true;
    return !localStorage.getItem('firstBattle');
};

Client.hadFirstBattle = function(){
    localStorage.setItem('firstBattle',true);
};

// #### RECEIVERS ####

Client.socket.on(Client.initEventName,function(data){ // This event triggers when receiving the initialization packet from the server, to use in Game.initWorld()
    console.log('Init packet received');
    //if(data instanceof ArrayBuffer) data = Decoder.decode(data,CoDec.initializationSchema); // if in binary format, decode first
    Client.socket.emit('ponq',data.stamp); // send back a pong stamp to compute latency
    Engine.configEngine(data.config);
    Engine.initWorld(data.player);
    //Game.updateNbConnected(data.nbconnected);
});

Client.socket.on('wait',function(){
    // wait is sent back from the server when the client attempts to connect before the server is done initializing and reading the map
    console.log('Server not ready, re-attempting...');
    setTimeout(Client.requestData, 500); // Just try again in 500ms
});

Client.socket.on('settlement-data',function(data){
    UI.displaySettlements(data);
});

Client.socket.on('camps-data',function(data){
    UI.displayCamps(data);
});

Client.socket.on('boot-params',function(data){
    Client.bootParameters = data;
    console.log(Client.bootParameters);
    Boot.bootParamsReceived();
});

Client.socket.on('update',function(data){ // This event triggers uppon receiving an update packet (data)
    //if(data instanceof ArrayBuffer) data = Decoder.decode(data,CoDec.finalUpdateSchema); // if in binary format, decode first
    //Client.socket.emit('ponq',data.stamp);  // send back a pong stamp to compute latency
    //if(data.nbconnected !== undefined) Game.updateNbConnected(data.nbconnected);
    //if(data.latency) Game.setLatency(data.latency);
    //if(data.latency) console.log('[lat] '+data.latency+' ms');
    if(data.local) console.log(data.local);
    //if(data.global) console.log(data.global);
    if(data.local) Engine.updateSelf(data.local); // Should come first
    if(data.global) Engine.updateWorld(data.global);
});

Client.socket.on('pid',function(playerID){ // the 'pid' event is used for the server to tell the client what is the ID of the player
    Client.setLocalData(playerID);
});

Client.setLocalData = function(id){ // store the player ID in localStorage
    //console.log('your ID : '+id);
    localStorage.setItem(Client.storageIDKey,id);
    localStorage.setItem('idStamp',Date.now());
};

/// ##### SENDERS ######

Client.requestSettlementData = function(){
    Client.socket.emit('settlement-data');
};

Client.requestCampsData = function(){
    Client.socket.emit('camps-data');
};

Client.sendPath = function(path,action){
    Client.socket.emit('path',{path:path,action:action});
};

// TODO: remove after testing
Client.buildingClick = function(targetID){
    Client.socket.emit('buildingClick',{id:targetID});
};

Client.NPCClick = function(targetID,type){
    Client.socket.emit('NPCClick',{id:targetID,type:type});
};

Client.battleAction = function(action,data){
    data.action = action;
    Client.socket.emit('battleAction',data);
};

Client.sendCraft = function(id,nb,stock){
    Client.socket.emit('craft',{id:id,nb:nb,stock:stock});
};

Client.sendPurchase = function(id,nb, action){
    Client.socket.emit('shop',{id:id,nb:nb,action:action});
};

Client.sendStock  = function(item,nb,building,action){
    Client.socket.emit('stock',{item:item,nb:nb,building:building,action:action});
};

Client.sendUse = function(id){
    Client.socket.emit('use',{item:id});
};

Client.sendUnequip = function(slot,subslot){
    Client.socket.emit('unequip',{slot:slot,subslot:subslot});
};

Client.sendExit = function(){
    Client.socket.emit('exit');
};

Client.sendBuild = function(id,tile){
    Client.socket.emit('build',{id:id,tile:tile});
};

Client.sendCommit = function(){
    Client.socket.emit('commit');
};

Client.sendChat = function(text){
    console.log('sending',text);
    Client.socket.emit('chat',text);
};

Client.sendRespawn = function(){
    Client.socket.emit('respawn');
};

// ####################"

Client.sendMapData = function(id,data){
    Client.socket.emit('mapdata',{id:id,data:data});
};

Client.sendScreenshot = function(image,browser){
    Client.socket.emit('screenshot',{img:image,browser:browser});
};