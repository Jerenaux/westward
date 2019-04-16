/**
 * Created by jeren on 10-12-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    var Utils = require('../shared/Utils.js').Utils;
}

var Stats = {
    hpmax: {
        min: 0,
        max: 10000,
        noModifier: true,
        hidden: true
    },
    hp: {
        name: 'Health',
        desc: 'If it gets to 0, you die. Potions can replenish it.',
        min: 0,
        max: 10000,
        frame: 1,
        hasMax: 'hpmax',
        noModifier: true
    },
    /*fat: {
        name: 'Fatigue',
        desc: 'Fatigue increases as you perform actions and can impact your other stats negatively past a certain point. Rest and some potions can reduce it.',
        min: 0,
        max: 100,
        start: 0,
        frame: 0,
        suffix: '%'
    },*/
    dmg: {
        name: 'Damage',
        desc: 'Offensive power of your attacks. Depends on the currently equipped weapon (melee or ranged).',
        min: 0,
        max: 1000,
        frame: 3
    },
    def: {
        name: 'Defense',
        desc: 'Resistance to all types of damage. Can be increased by several pieces of equipment.',
        min: 0,
        max: 1000,
        frame:4
    },
    acc: {
        name: 'Accuracy',
        desc: 'Indicates your base chances to hit a target with a ranged weapon. It depends on the currently equipped ranged weapon. In battle, this number decreases based on the distance to the target.',
        min: 0,
        max: 100,
        default: 50,
        frame: 2,
        suffix: '%'
    }
};

function StatsContainer(){
    for(var statKey in Stats){
        if(!Stats.hasOwnProperty(statKey)) return;
        var statData = Stats[statKey];
        var max = (statData.hasMax ? this[statData.hasMax] : null);
        this[statKey] = new Stat(statKey,statData.default,max);
    }
}

/*function getStatsShell(){
    var shell = {};
    for(var statKey in Stats){
        if(!Stats.hasOwnProperty(statKey)) return;
        var statData = Stats[statKey];
        var max = (statData.hasMax ? shell[statData.hasMax] : null);
        shell[statKey] = new Stat(statKey,statData.default,max);
    }
    return shell;
}*/

if (onServer){
    module.exports.Stats = Stats;
    module.exports.StatsContainer = StatsContainer;
}

function Stat(key,value,max){
    this.key = key;
    this.maxStat = max;
    this.absoluteModifiers = [];
    this.relativeModifiers = [];
    this.setBaseValue(value || 0);
}

Stat.prototype.getBaseValue = function(){
    return this.baseValue;
};

Stat.prototype.getCap = function(){
    var statData = Stats[this.key];
    return (this.maxStat ? Math.min(this.maxStat.getValue(),statData.max) : statData.max);
};

Stat.prototype.clamp = function(v){
    var statData = Stats[this.key];
    //console.warn('clamping',this.key,'between',statData.min,this.getCap());
    var c = Utils.clamp(v,statData.min,this.getCap());
    //console.warn('#',c,v,statData.min,this.getCap());
    return c;
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
    var v = this.clamp(value);
    //console.warn('!',this.key,v);
    this.baseValue = v;
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

/*Stat.prototype.maximize = function(){
    //console.warn('Maximizing ',this.key,' to',this.maxStat.getValue());
    this.setBaseValue(this.maxStat.getValue());
};*/

Stat.prototype.removeAbsoluteModifier = function(modifier){
    var idx = this.absoluteModifiers.indexOf(modifier);
    if(idx > -1) this.absoluteModifiers.splice(idx,1);
};

Stat.prototype.removeRelativeModifier = function(modifier){
    var idx = this.relativeModifiers.indexOf(modifier);
    if(idx > -1) this.relativeModifiers.splice(idx,1);
};

Stat.prototype.clearRelativeModifiers = function(){
    this.relativeModifiers = [];
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
