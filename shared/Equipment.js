/**
 * Created by Jerome on 12-12-17.
 */

var onServer = (typeof window === 'undefined');

var Equipment = {
    nbAccessories: 3,
    list: ['rangedw','meleew','shield','armor','belt','boots','necklace'],
    dict: {
        meleew:{
            x: 100,
            y: 115,
            shade: 'sword'
        },
        rangedw:{
            x: 100,
            y: 65,
            shade: 'gun'
        },
        shield:{
            x: 200,
            y: 65,
            shade: 'shield'
        },
        armor:{
            x: 150,
            y: 50,
            shade: 'armor'
        },
        belt:{
            x: 150,
            y: 100,
            shade: 'belt'
        },
        boots:{
            x: 150,
            y: 150,
            shade: 'boots'
        },
        necklace:{
            x: 200,
            y: 15,
            shade: 'necklace'
        },
        acc:{
            x: 100,
            y: 200,
            shade: 'ring'
        }

    }
};

Equipment.getSkeleton = function(){
    var skeleton = {};
    for(var i = 0; i < Equipment.list.length; i++){
        var equip = Equipment.list[i];
        skeleton[equip] = -1;
    }
    skeleton['acc'] = [];
    for(var i = 0; i < Equipment.nbAccessories; i++){
        skeleton['acc'].push(-1);
    }
    return skeleton;
};

if (onServer) module.exports.Equipment = Equipment;