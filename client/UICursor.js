/**
 * Created by Jerome on 29-11-17.
 */
import CustomSprite from './CustomSprite';
import UI from './UI';

const UICursor = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function UICursor() {

        CustomSprite.call(this, 'UI', UI.getGameWidth()/2, UI.getGameHeight()/2, 'cursors','cursor');

        this.setDepth(10);
        this.setOrigin(0,0);

        this.cursorFrames = {
            default: 'cursor',
            bomb: 'bombcursor',
            bow: 'bow',
            building: 'door',
            combat: 'sabre',
            gun: 'gun',
            item: 'hand',
            melee: 'melee',
            move: 'movement'
        };
        // List of cursors that change appearance when the mouse is pressed
        this.dualCursors = ['move', 'item', 'building', 'combat', 'melee', 'bow', 'gun'];
        this.currentFrame = 'cursor'; // current frame displayed, regardless of pressed or not
    },

    updatePosition: function(x, y){
        this.setPosition(
            x,
            y
        );
    },

    changeCursor: function(cursor){
        var frameKey = cursor || 'default';
        this.setFrame(this.cursorFrames[frameKey]);
        this.currentFrame = frameKey;
    },

    /**
     * Called when releasing the click
     */
    up: function(){
        if(this.dualCursors.includes(this.currentFrame)) this.setFrame(this.cursorFrames[this.currentFrame]);
    },

    /**
     * Called when clicking; if the currently displayed cursor has a 'pressed' frame (ending in 2 in the frame names),
     * then display it
     */
    down: function(){
        if(this.dualCursors.includes(this.currentFrame)) this.setFrame(this.cursorFrames[this.currentFrame]+'2');
    },

    display: function () {
        this.setVisible(true);
    },

    hide: function () {
        this.setVisible(false);
    }

});

export default UICursor;