/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 02-04-19.
 */

var Models = {
    BuildingModel: {
        id: {type: Number, min: 0, required: true},
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        type: {type: Number, min: 0, required: true},
        owner: {type: Number, min: 0},
        ownerName: {type: String},
        inventory: {type: Array},
        prices: {type: Object},
        gold: {type: Number, min: 0},
        built: {type: Boolean},
    }
};

module.exports = Models;
