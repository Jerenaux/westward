/**
 * Created by jeren on 10-12-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    var Utils = require('../shared/Utils.js').Utils;
}

var Stats = {
    list: ['hp','fat','acc','def','mdmg','rdmg'],
    dict: {
        hp: {
            name: 'Health',
            min: 0,
            max: 100,
            start: 100,
            frame: 1,
            showMax: true,
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
            max: 100,
            start: 5,
            frame:4
        },
        mdmg: {
            name: 'Melee Damage',
            min: 0,
            max: 100,
            start: 10,
            frame: 3
        },
        rdmg: {
            name: 'Ranged Damage',
            min: 0,
            max: 100,
            start: 10,
            frame: 5
        }
    }
};

Stats.getSkeleton = function(){
    var skeleton = {};
    for(var statKey in Stats.dict){
        if(!Stats.dict.hasOwnProperty(statKey)) return;
        var statData = Stats.dict[statKey];
        skeleton[statKey] = new Stat(statKey,statData.start);
    }
    return skeleton;
};

if (onServer) module.exports.Stats = Stats;

function Stat(key,value){
    this.key = key;
    this.baseValue = value;
    this.absoluteModifiers = [];
    this.relativeModifiers = [];
}

Stat.prototype.getBaseValue = function(){
    return this.baseValue;
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
    return Utils.clamp(Math.round(base),statData.min,statData.max);
};

Stat.prototype.setBaseValue = function(value){
    var statData = Stats.dict[this.key];
    this.baseValue = Utils.clamp(value,statData.min,statData.max);
};

Stat.prototype.increment = function(inc){
    this.setBaseValue(this.baseValue+inc);
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
