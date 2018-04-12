/**
 * Created by jeren on 10-12-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    var Utils = require('../shared/Utils.js').Utils;
}

var Stats = {
    dict: {
        hpmax: {
            name: 'Health',
            desc: 'If it gets to 0, you die. Potions can replenish it.',
            min: 0,
            max: 10000,
            start: 100,
            frame: 1,
            isMax: 'hp'
        },
        hp: {
            name: 'Health',
            desc: 'If it gets to 0, you die. Potions can replenish it.',
            min: 0,
            max: 10000,
            start: 100,
            frame: 1,
            hasMax: 'hpmax',
            noModifier: true
        },
        fat: {
            name: 'Fatigue',
            desc: 'Fatigue increases as you perform actions and can impact your other stats negatively past a certain point. Rest and some potions can reduce it.',
            min: 0,
            max: 100,
            start: 0,
            frame: 0,
            suffix: '%'
        },
        acc: {
            name: 'Accuracy',
            desc: 'Indicates your base chances to hit a target with a ranged weapon. It depends on the currently equipped ranged weapon. In battle, this number decreases based on the distance of the target.',
            min: 0,
            max: 100,
            start: 0,
            frame: 2,
            suffix: '%'
        },
        def: {
            name: 'Defense',
            desc: 'Resistance to all types of damage. Can be increased by several pieces of equipment.',
            min: 0,
            max: 1000,
            start: 7,
            frame:4
        },
        mdmg: {
            name: 'Melee Damage',
            desc: 'Offensive power of your melee attacks. Depends on the currently equipped melee weapon.',
            min: 0,
            max: 1000,
            start: 12,
            frame: 3
        },
        rdmg: {
            name: 'Ranged Damage',
            desc: 'Offensive power of your ranged attacks. Depends on the projectiles of the currently equipped ranged weapon.',
            min: 0,
            max: 1000,
            start: 10,
            frame: 5
        },
        smith: {
            name: 'Smithing',
            desc: 'Reflects your ability to craft items and equipment.',
            min: 0,
            max: 100,
            start: 10,
            frame: 6,
            suffix: '%'
        },
        brew: {
            name: 'Brewing',
            desc: 'Reflects your ability to craft potions and consumables.',
            min: 0,
            max: 100,
            start: 10,
            frame: 7,
            suffix: '%'
        },
        skin: {
            name: 'Harvesting',
            desc: 'Reflects your ability to gather items from dead animals or from plants.',
            min: 0,
            max: 100,
            start: 10,
            frame: 8,
            suffix: '%'
        },
        nego: {
            name: 'Negotiation',
            desc: 'Reflects your ability to negotiate better prices when trading.',
            min: 0,
            max: 100,
            start: 10,
            frame: 9,
            suffix: '%'
        },
        orient: {
            name: 'Orientation',
            desc: 'Reflects your ability to find objects, people and locations in the wild.',
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
    var base = this.getBaseValue();
    this.absoluteModifiers.forEach(function(m){
        base += m;
    });
    this.relativeModifiers.forEach(function(m){
        base *= (1+(m/100));
    });
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
    if(isNaN(modifier)) return;
    this.absoluteModifiers.push(modifier);
};

Stat.prototype.addRelativeModifier = function(modifier){
    if(isNaN(modifier)) return;
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

Stat.prototype.trim = function(){
      var obj = {
          k: this.key,
          v: this.getBaseValue(),
          r: this.relativeModifiers,
          a: this.absoluteModifiers
      };
      if(obj.r.length == 0) obj.r = undefined;
      if(obj.a.length == 0) obj.a = undefined;
      return obj;
};

if (onServer) module.exports.Stat = Stat;
