/**
 * Created by jeren on 10-12-17.
 */

import Utils from './Utils'

var Stats = {
    hpmax: {
        min: 0,
        max: 10000,
        default: 100,
        noModifier: true,
        hidden: true
    },
    hp: {
        name: 'Vitality',
        desc: 'Represents how healthy you are. If it gets to 0, you die. Look for medicine to replenish.',
        min: 0,
        max: 10000,
        default: 100,
        frame: 'heart',
        hasMax: 'hpmax',
        noModifier: true
    },
    vigor: {
        name: 'Vigor',
        desc: 'Decreases as you perform actions and become tired. If it gets too low, it will negatively impact your other stats and disable most of your abilities. Look for shelter to replenish.',
        min: 0,
        max: 100,
        default: 100,
        noModifier: true,
        frame: 'goldenheart',
        suffix: '%'
    },
    food: {
        name: 'Food',
        desc: 'Decreases over time. As it gets lower, your vigor will decrease faster and faster. Look for food to replenish.',
        min: 0,
        max: 100,
        default: 100,
        noModifier: true,
        frame: 'bread',
        suffix: '%'
    },
    dmg: {
        name: 'Damage',
        desc: 'Offensive power of your attacks. Depends on the currently equipped weapon (melee or ranged).',
        min: 0,
        max: 1000,
        frame: 'sword'
    },
    def: {
        name: 'Defense',
        desc: 'Resistance to all types of damage. Can be increased by several pieces of equipment.',
        min: 0,
        max: 1000,
        frame: 'armor'
    },
    acc: {
        name: 'Accuracy',
        desc: 'Base chances to hit a target with a ranged weapon. Depends on the currently equipped ranged weapon. In battle, this number decreases based on the distance to the target.',
        min: 0,
        max: 100,
        default: 50,
        frame: 'bullseye',
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

StatsContainer.prototype.toList = function(){
    var list = [];
    for(var statKey in Stats){
        if(!Stats.hasOwnProperty(statKey)) return;
        list.push({stat:statKey,value:this[statKey].getBaseValue()});
    }
    return list;
};


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

Stat.prototype.setBaseValue = function(value,force){
    var v = (force ? value : this.clamp(value));
    this.baseValue = v;
};

Stat.prototype.increment = function(inc){
    var base = this.clamp(this.getBaseValue());
    this.setBaseValue(base+inc);
    return (this.getBaseValue() != base); // has the value actually changed or not
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

export {Stat, Stats, StatsContainer}
