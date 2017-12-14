/**
 * Created by jeren on 10-12-17.
 */

var onServer = (typeof window === 'undefined');

var Stats = {
    list: ['hp','fat','acc','def','mdmg','rdmg'],
    dict: {
        hp: {
            name: 'Health',
            min: 0,
            max: 100,
            start: 50,
            frame: 1
        },
        fat: {
            name: 'Fatigue',
            min: 0,
            max: 100,
            start: 0,
            frame: 0,
            suffix: '%'
        },
        acc: {
            'key': 'acc',
            name: 'Accuracy',
            min: 0,
            max: 100,
            start: 50,
            frame: 2,
            suffix: '%'
        },
        def: {
            'key': 'def',
            name: 'Defense',
            min: 0,
            max: 100,
            start: 10,
            frame:4
        },
        mdmg: {
            'key': 'mdmg',
            name: 'Melee Damage',
            min: 0,
            max: 100,
            start: 10,
            frame: 3
        },
        rdmg: {
            'key': 'rdmg',
            name: 'Ranged Damage',
            min: 0,
            max: 100,
            start: 10,
            frame: 5
        }
    }
};

Stats.getSkeleton = function(){
    var skeleton = {};
    for(var i = 0; i < Stats.list.length; i++){
        var key = Stats.list[i];
        skeleton[key] = 0;
    }
    return skeleton;
};

if (onServer) module.exports.Stats = Stats;