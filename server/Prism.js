/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 21-03-18.
 */

var mongoose = require('mongoose');
// import mongoose from 'mongoose'
// All events correspond to *actions* performed by *players*

// var sessionSchema = new mongoose.Schema({
//     pid: {type: Number, min: 0},
//     pname: String,
//     start: { type: Date, default: Date.now },
//     end: { type: Date, default: Date.now }
// });
// var Session = mongoose.model('Session', sessionSchema);

var eventSchema = new mongoose.Schema({
    pid: {type: Number, min: 0},
    pname: String,
    time: { type: Date, default: Date.now },
    action: {type: String}, // Also used in admin
    desc: {type: String},
    session: {type: Number}
});
var Event = mongoose.model('Event', eventSchema);

Event.prototype.prefix = function(){
    var t = new Date(this.time);
    var prefix = "["+t.getDate()+"/"+(t.getMonth()+1)+" "+t.getHours()+":"+("0"+t.getMinutes()).slice(-2)+":"+("0"+t.getSeconds()).slice(-2)+"]"; // Slice: to ensure 0 padding
    // console.log(this.__t,t,dateStr);
    if(this.pname) prefix = '['+this.pname+']'+prefix;
    return prefix+' ';
};

/*Event.prototype.toLog = function(){
    return this.__t;
};*/
var TradeEvent = Event.discriminator(
    'TradeEvent',
    new mongoose.Schema({
        price: Number,
        item: Number,
        nb: Number,
        building: Number,
        owner: String
    }),
    {discriminatorKey: 'kind'}
);
TradeEvent.prototype.getDesc = function(){
    var txt = [];
    return this.prefix()+txt;
};

var CraftEvent = Event.discriminator(
    'CraftEvent',
    new mongoose.Schema({
        item: Number,
        nb: Number,
    }),
    {discriminatorKey: 'kind'}
);

var UseEvent = Event.discriminator(
    'UseEvent',
    new mongoose.Schema({
        item: Number
    }),
    {discriminatorKey: 'kind'}
);

var PickUpEvent = Event.discriminator(
    'PickUpEvent',
    new mongoose.Schema({
        item: Number
    }),
    {discriminatorKey: 'kind'}
);

var PricesEvent = Event.discriminator(
    'PricesEvent',
    new mongoose.Schema({
        item: Number,
        buy: Number,
        sell: Number
    }),
    {discriminatorKey: 'kind'}
);

var LootEvent = Event.discriminator(
    'LootEvent',
    new mongoose.Schema({
        name: String
    }),
    {discriminatorKey: 'kind'}
);

var ExploreEvent = Event.discriminator(
    'ExploreEvent',
    new mongoose.Schema({
        aoi: Number
    }),
    {discriminatorKey: 'kind'}
);

var GoldEvent = Event.discriminator(
    'GoldEvent',
    new mongoose.Schema({
        amount: Number,
        building: Number
    }),
    {discriminatorKey: 'kind'}
);

var BeltEvent = Event.discriminator(
    'BeltEvent',
    new mongoose.Schema({
        item: Number,
        direction: String
    }),
    {discriminatorKey: 'kind'}
);

var BuildingEvent = Event.discriminator(
    'BuildingEvent',
    new mongoose.Schema({
        building: Number,
        owner: String
    }),
    {discriminatorKey: 'kind'}
);

var NewBuildingEvent = Event.discriminator(
    'NewBuildingEvent',
    new mongoose.Schema({
        building: Number,
        x: Number,
        y: Number
    }),
    {discriminatorKey: 'kind'}
);

var BattleEvent = Event.discriminator(
    'BattleEvent',
    new mongoose.Schema({
        category: String,
        type: Number
    }),
    {discriminatorKey: 'kind'}
);

var ChatEvent = Event.discriminator(
    'ChatEvent',
    new mongoose.Schema({
        txt: String
    }),
    {discriminatorKey: 'kind'}
);
ChatEvent.prototype.getDesc = function(){
    return this.prefix()+'Said "'+this.txt+'"';
};

var MenuEvent = Event.discriminator(
    'MenuEvent',
    new mongoose.Schema({
        menu: String
    }),
    {discriminatorKey: 'kind'}
);

var HelpEvent = Event.discriminator(
    'HelpEvent',
    new mongoose.Schema({
        which: String
    }),
    {discriminatorKey: 'kind'}
);

var ConnectEvent = Event.discriminator(
    'ConnectEvent',
    new mongoose.Schema({
        stl: Number,
        name: String,
        re: Boolean
    }),
    {discriminatorKey: 'kind'}
);

var DisconnectEvent = Event.discriminator(
    'DisconnectEvent',
    new mongoose.Schema(),
    {discriminatorKey: 'kind'}
);

var RespawnEvent = Event.discriminator(
    'RespawnEvent',
    new mongoose.Schema(),
    {discriminatorKey: 'kind'}
);

var ServerStartEvent = Event.discriminator(
    'ServerStartEvent',
    new mongoose.Schema(),
    {discriminatorKey: 'kind'}
);

var TutorialStartEvent = Event.discriminator(
    'TutorialStartEvent',
    new mongoose.Schema(),
    {discriminatorKey: 'kind'}
);

var TutorialEndEvent = Event.discriminator(
    'TutorialEndEvent',
    new mongoose.Schema({
        step: Number
    }),
    {discriminatorKey: 'kind'}
);

var Prism = {};

Prism.logEvent = function(player,action,data){
    data = data || {};
    data.action = action;
    data.pid = (player ? player.id : null);
    data.pname = (player ? player.name : null);
    data.session = (player ?player.logSession : null);

    var map = {
        'battle': BattleEvent,
        'belt': BeltEvent,
        'building': BuildingEvent,
        'buy': TradeEvent,
        'chat': ChatEvent,
        'connect': ConnectEvent,
        'craft': CraftEvent,
        'disconnect': DisconnectEvent,
        'explore': ExploreEvent,
        'gold': GoldEvent,
        'help': HelpEvent,
        'loot': LootEvent,
        'menu': MenuEvent,
        'newbuilding': NewBuildingEvent,
        'pickup': PickUpEvent,
        'prices': PricesEvent,
        'respawn': RespawnEvent,
        'sell': TradeEvent,
        'server-start': ServerStartEvent,
        'tutorial-end': TutorialEndEvent,
        'tutorial-start': TutorialStartEvent,
        'use': UseEvent
    };
    if(!(action in map)){
        console.warn('PRISM: Unrecognized event');
        return;
    }
    var event = new map[action](data);
    if(event.getDesc){
        event.desc = event.getDesc();
        console.log('DESC:',event.desc);
    }
    // console.log('event : ',event);
    event.save(function(err){
        if(err) throw err;
        // console.log('Event logged');
    });
};

/*function getItemData(data){
    var fields = Object.keys(TradeEvent.schema.paths).filter(function(k){
        return k[0] != '_';
    });
    fields.forEach(function(field){
        data[field] = (data[field] !== undefined ? data[field] : GameServer.itemsData[data.item][field]);
    });
    return data;
}*/

export default Prism