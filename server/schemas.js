/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 09-02-19.
 */
let mongoose = require('mongoose');

let Schemas = {
    settlementSchema : mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        name: {type: String, required: true},
        description: String,
        population: {type: Number, min: 0, required: true},
        level: {type: Number, min: 0, required: true},
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true}
    }),

    buildingSchema : mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        type: {type: Number, min: 0, required: true},
        //sid: {type: Number, min: 0, required: true},
        owner: {type: Number, min: 0},
        ownerName: {type: String},
        inventory: {type: [[]], set:function(inventory){
                return inventory.toList(true); // true: filter zeroes
            }},
        prices: mongoose.Schema.Types.Mixed,
        gold: {type: Number, min: 0},
        built: Boolean,
        health: {type: Number, min: 0}
    }),

    playerSchema : mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        name: {type: String, required: true},
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        inBuilding: {type: Number, min:-1, default: -1},
        savestamp: {type : Date, default: Date.now },
        gold: {type: Number, min: 0, default: 0},
        classxp: mongoose.Schema.Types.Mixed,
        classlvl: mongoose.Schema.Types.Mixed,
        ap: mongoose.Schema.Types.Mixed,
        equipment: mongoose.Schema.Types.Mixed,
        commitSlots: mongoose.Schema.Types.Mixed,
        sid: {type: Number, min: 0, required: true},
        inventory: {type: [[]], set:function(inventory){
                return inventory.toList(true); // true: filter zeroes
            }},
        belt: {type: [[]], set:function(belt){
                console.warn(belt.toList(true));
                return belt.toList(true); // true: filter zeroes
            }},
        stats: {type: [], set:function(stats){
                return stats.toList();
            }},
        history: {type: []}
    })
};

module.exports = Schemas;

