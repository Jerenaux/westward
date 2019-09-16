/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 09-02-19.
 */
let mongoose = require('mongoose');

let Schemas = {
    buildingSchema : mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        type: {type: Number, min: 0, required: true},
        owner: {type: Number, min: 0},
        ownerName: {type: String},
        inventory: {type: [], set:function(inventory){
                return inventory.toList(true); // true: filter zeroes
            }},
        prices: mongoose.Schema.Types.Mixed,
        gold: {type: Number, min: 0},
        built: Boolean,
        civ: Boolean,
        campID: Number,
        stats: {type: [], set:function(stats){
                return stats.toList();
        }}
    }),

    campSchema : mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        center: mongoose.Schema.Types.Mixed,
    }),

    ephemeralMarkerSchema: mongoose.Schema({
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        type: String,
        createdAt: { type: Date, expires: 3600*24*30, default: Date.now } //TODO: conf
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
        origin: {type: Number, min: 0, required: true},
        inventory: {type: mongoose.Schema.Types.Mixed, set:function(inventory){
                // console.log('#@',inventory);
                return inventory.toList(true); // true: filter zeroes
            }},
        belt: {type: mongoose.Schema.Types.Mixed, set:function(belt){
                return belt.toList(true); // true: filter zeroes
            }},
        stats: {type: mongoose.Schema.Types.Mixed, set:function(stats){
                return stats.toList();
            }},
        history: {type: []}
    }),

    remainsSchema: mongoose.Schema({
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        type: Number,
        createdAt: { type: Date, expires: 3600*24*30, default: Date.now } // TODO: conf
    })
};

export default Schemas
