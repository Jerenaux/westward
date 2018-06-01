/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 14-02-18.
 */

var onServer = (typeof window === 'undefined');

if(onServer) {
    var Utils = require('../shared/Utils.js').Utils;
}

var Formulas = {};

Formulas.decimalToPct = function(decimalValue){
    if(Math.abs(decimalValue) >= 10 ) {
        console.warn('WARNING: wrong number format for decimal value',decimalValue);
        //console.trace();
    }
    return Math.round(Utils.clamp(decimalValue,-2,2)*100);
};

Formulas.pctToDecimal = function(pctValue){
    if(Math.abs(pctValue) < 1 ) console.warn('WARNING: wrong number format for %',pctValue);
    return Utils.clamp(pctValue,-200,200)/100;
};

// For modifiers, all formulas expect decimal values as input and return decimal values as output

Formulas.foodConsumption = function(population){
    return population;
};

Formulas.computeRequiredFood = function(population){
    return population*10;
};

Formulas.commitmentProductivityModifier = function(commitment){
    return (2*commitment)/100;
};

Formulas.computeProductivity = function(foodModifier,commitModifier){
    //return Utils.clamp(100 + foodModifier + commitModifier,0,1000);
    return Utils.clamp(1 + foodModifier + commitModifier,0,10); // TODO: is it ok to allow 0 producivity?
};

Formulas.computeBuildIncrement = function(prod,rate){
    return Math.round(prod*rate); // rate is not trated as a %
};

Formulas.computeProdIncrement = function(prod,nb){
    return Math.round(prod*nb);
};

Formulas.computePlayerFoodModifier = function(surplus){
    return surplus/2;
};

Formulas.computeSettlementFoodModifier = function(surplus){
    return (surplus*40)/100; // TODO: factor in dev level
};

Formulas.computeMaxCivicXP = function(level){
    return Math.round(Math.exp((level)/5)*100);
};

if (onServer) module.exports.Formulas = Formulas;