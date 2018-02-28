/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 14-02-18.
 */

var onServer = (typeof window === 'undefined');

if(onServer) {
    var Utils = require('../shared/Utils.js').Utils;
}

var Formulas = {};

Formulas.computeBuildIncrement = function(prod,rate){
    return Math.round((prod/100)*rate);
};

Formulas.computeProdIncrement = function(prod,nb){
    return Math.round((prod/100)*nb);
};

Formulas.foodProductivityModifier = function(surplus){
    return surplus*40; // TODO: include dev level
};

Formulas.commitmentProductivityModifier = function(commitment){
    return 2*commitment;
};

Formulas.computeProductivity = function(foodModifier,commitModifier){
    // Adapt 'deduceFoodModifier()' accordingly
    return Utils.clamp(100 + foodModifier + commitModifier,0,1000);
};

Formulas.deduceFoodModifier = function(total,commitModifier){
    return total - 100 - commitModifier;
};

Formulas.computePlayerFoodModifier = function(surplus){
    return surplus/2;
};

Formulas.test = function(dmg,def){
    //return Math.max(a.getStat('mdmg').getValue() - b.getStat('def').getValue(),0);
    var dmgRnd = dmg/5;
    var defRnd = def/5;
    dmg += Utils.randomInt(dmg-dmgRnd,dmg+dmgRnd);
    def += Utils.randomInt(def-defRnd,def+defRnd);
    var dmg = (10*Math.pow(dmg,0.5)) - (5*Math.pow(def,0.5));
    return Math.ceil(dmg);
};


if (onServer) module.exports.Formulas = Formulas;