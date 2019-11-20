/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 09-02-19.
 */

let mongoose = require('mongoose');

// let Schemas = require('../server/schemas.js');

let Schemas = {
    buildingSchema : mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        type: {type: Number, min: 0, required: true},
        owner: {type: Number, min: 0},
        ownerName: {type: String},
        inventory: {type: mongoose.Schema.Types.Mixed, set:function(inventory){
                return inventory.toList(true); // true: filter zeroes
            }},
        prices: mongoose.Schema.Types.Mixed,
        gold: {type: Number, min: 0},
        built: Boolean,
        civ: Boolean,
        campID: Number,
        stats: {type: mongoose.Schema.Types.Mixed, set:function(stats){
                return stats.toList();
            }}
    })
}

function fetch(){
    mongoose.connect(process.env.FROM_URI, { useNewUrlParser: true });
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log('Connection to ',process.env.FROM_URI);
        let BuildingModel = mongoose.model('Building', Schemas.buildingSchema);
        BuildingModel.find(function (err, buildings) {
            if (err) return console.log(err);
            console.log(buildings);
            mongoose.connection.close();
            //insert(buildings);
        });
    });
}

function insert(buildings){
    mongoose.connect((process.env.TO_URI || 'mongodb://localhost:27017/westward'),{ useNewUrlParser: true });
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log('Connection to other db established');
        let BuildingModel = mongoose.model('Building', Schemas.buildingSchema);
        BuildingModel.remove({},function(err){
            if (err) return console.log(err);
            BuildingModel.collection.insert(buildings, function(err,docs){
                if (err) return console.log(err);
                console.log('Buildings synced!');
            })
        })
    });
}

fetch();
