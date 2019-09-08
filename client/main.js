import Phaser from '../node_modules/phaser/dist/phaser.min.js'

import Boot from './Boot';
import Engine from './Engine';
import UI from './UI';

import './style.css'
import './w3.css'

// TODO: move in conf?
var VIEW_WIDTH = 32;
var VIEW_HEIGHT = 18;
var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

var config = {
    //type: (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 ? Phaser.CANVAS : Phaser.AUTO),
    type: Phaser.WEBGL,
    width: VIEW_WIDTH*TILE_WIDTH,
    height: VIEW_HEIGHT*TILE_HEIGHT,
    parent: 'game',
    scene: [Boot, UI, Engine],
    dom: {
        createContainer: true
      }
};

var game = new Phaser.Game(config);