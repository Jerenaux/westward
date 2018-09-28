/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 21-03-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var mongoose = require('mongoose');

// All events correspond to *actions* performed by *players*
// Frequency tables and means don't need logging

var eventSchema = new mongoose.Schema({
    pid: {type: Number, min: 0},
    time: { type: Date, default: Date.now },
    action: {type: String}
});
var Event = mongoose.model('Event', eventSchema);

var TradeEvent = Event.discriminator(
    'TradeEvent',
    new mongoose.Schema({
        price: Number,
        item: Number,
        nb: Number,
        building: Number
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

var BuildingEvent = Event.discriminator(
    'BuildingEvent',
    new mongoose.Schema({
        building: Number
    }),
    {discriminatorKey: 'kind'}
);


var ConnectEvent = Event.discriminator(
    'ConnectEvent',
    new mongoose.Schema({
        stl: Number
    }),
    {discriminatorKey: 'kind'}
);

var DisconnectEvent = Event.discriminator(
    'DisconnectEvent',
    new mongoose.Schema(),
    {discriminatorKey: 'kind'}
);

var Prism = {
    /*actions: {
        'buy': 0,
        'sell': 1,
        'connect': 2,
        'disconnect': 3
    }*/
};

Prism.logEvent = function(player,action,data){
    /*if(!(actionKey in Prism.actions)){
        console.warn('ERROR: Unrecognized action key');
        return;
    }
    var action = Prism.actions[actionKey];*/
    data = data || {};
    data.action = action;
    data.pid = player.id;

    var map = {
        'building': BuildingEvent,
        'buy': TradeEvent,
        'connect': ConnectEvent,
        'disconnect': DisconnectEvent,
        'explore': ExploreEvent,
        'sell': TradeEvent
    };
    if(!(action in map)){
        console.warn('PRISM: Unrecognized event');
        return;
    }
    var event = new map[action](data);//map[action].call(null,data);
    /*switch(action){
        case 'buy': // buy, fall-through to next
        case 'sell': // sell
            //data = getItemData(data);
            event = new TradeEvent(data);
            break;
        case 'connect': // connect
            event = new ConnectEvent(data);
            break;
        case 'disconnect':
            event = new DisconnectEvent(data);
            break;
        case 'explore':
            event = new ExploreEvent(data);
            break;
        default:
            console.warn('Unrecognized event');
            return;
    }*/
    console.log('event : ',event);
    event.save(function(err){
        if(err) throw err;
        console.log('Event logged');
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

module.exports.Prism = Prism;