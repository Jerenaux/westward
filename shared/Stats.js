/**
 * Created by jeren on 10-12-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    var Utils = require('../shared/Utils.js').Utils;
}

var Stats = {
    //list: ['hp','hpmax','fat','acc','def','mdmg','rdmg'],
    dict: {
        hpmax: {
            name: 'Health',
            min: 0,
            max: 10000,
            start: 100,
            frame: 1,
            isMax: 'hp'
        },
        hp: {
            name: 'Health',
            min: 0,
            max: 10000,
            start: 100,
            frame: 1,
            hasMax: 'hpmax',
            noModifier: true
        },
        fat: {
            name: 'Fatigue',
            min: 0,
            max: 100,
            start: 0,
            frame: 0,
            suffix: '%'
        },
        acc: {
            name: 'Accuracy',
            min: 0,
            max: 100,
            start: 50,
            frame: 2,
            suffix: '%'
        },
        def: {
            name: 'Defense',
            min: 0,
            max: 1000,
            start: 7,
            frame:4
        },
        mdmg: {
            name: 'Melee Damage',
            min: 0,
            max: 1000,
            start: 12,
            frame: 3
        },
        rdmg: {
            name: 'Ranged Damage',
            min: 0,
            max: 1000,
            start: 10,
            frame: 5
        },
        smith: {
            name: 'Smithing',
            min: 0,
            max: 100,
            start: 10,
            frame: 6,
            suffix: '%'
        },
        brew: {
            name: 'Brewing',
            min: 0,
            max: 100,
            start: 10,
            frame: 7,
            suffix: '%'
        },
        skin: {
            name: 'Harvesting',
            min: 0,
            max: 100,
            start: 10,
            frame: 8,
            suffix: '%'
        },
        nego: {
            name: 'Negotiation',
            min: 0,
            max: 100,
            start: 10,
            frame: 9,
            suffix: '%'
        },
        orient: {
            name: 'Orientation',
            min: 0,
            max: 100,
            start: 10,
            frame: 10,
            suffix: '%'
        }
    }
};

Stats.getSkeleton = function(){
    var skeleton = {};
    for(var statKey in Stats.dict){
        if(!Stats.dict.hasOwnProperty(statKey)) return;
        var statData = Stats.dict[statKey];
        var max = (statData.hasMax ? skeleton[statData.hasMax] : null);
        skeleton[statKey] = new Stat(statKey,statData.start,max);
    }
    return skeleton;
};

if (onServer) module.exports.Stats = Stats;

function Stat(key,value,max){
    this.key = key;
    this.maxStat = max;
    this.absoluteModifiers = [];
    this.relativeModifiers = [];
    this.setBaseValue(value);
}

Stat.prototype.getBaseValue = function(){
    return this.baseValue;
};

Stat.prototype.getCap = function(){
    var statData = Stats.dict[this.key];
    return (this.maxStat ? Math.min(this.maxStat.getValue(),statData.max) : statData.max);
};

Stat.prototype.clamp = function(v){
    var statData = Stats.dict[this.key];
    return Utils.clamp(v,statData.min,this.getCap());
};

Stat.prototype.getValue = function(){
    var statData = Stats.dict[this.key];
    var base = this.getBaseValue();
    this.absoluteModifiers.forEach(function(m){
        base += m;
    });
    this.relativeModifiers.forEach(function(m){
        base *= (1+m);
    });
    //return Utils.clamp(Math.round(base),statData.min,this.getCap());
    return this.clamp(Math.round(base));
};

Stat.prototype.setBaseValue = function(value){
    this.baseValue = this.clamp(value);
};

Stat.prototype.increment = function(inc){
    var base = this.clamp(this.getBaseValue());
    this.setBaseValue(base+inc);
};

Stat.prototype.addAbsoluteModifier = function(modifier){
    this.absoluteModifiers.push(modifier);
};

Stat.prototype.addRelativeModifier = function(modifier){
    this.relativeModifiers.push(modifier);
};

Stat.prototype.removeAbsoluteModifier = function(modifier){
    var idx = this.absoluteModifiers.indexOf(modifier);
    if(idx > -1) this.absoluteModifiers.splice(idx,1);
};

Stat.prototype.removeRelativeModifier = function(modifier){
    var idx = this.relativeModifiers.indexOf(modifier);
    if(idx > -1) this.relativeModifiers.splice(idx,1);
};

if (onServer) module.exports.Stat = Stat;
