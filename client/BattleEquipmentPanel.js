/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 31-08-19.
 */
import Capsule from './Capsule'
import Engine from './Engine'
import ItemSprite from './ItemSprite'
import {MiniProgressBar} from "./ProgressBar"
import Panel from './Panel'
import UI from './UI'

import itemsData from '../assets/data/items.json'

function BattleEquipmentPanel() {
    Panel.call(this, 0, 0, 0, 0, '', true); // true = invisible

    this.addLifeBar();
    this.melee = this.addEquipmentHolder(950, 515);
    this.range = this.addEquipmentHolder(1000, 500, true);

    this.atkCapsule = new Capsule(UI.scene, 870, 510, 'UI', '2swords');
    this.atkCapsule.update = function () {
        this.setText(1);
    };
    this.defCapsule = new Capsule(UI.scene, 815, 510, 'UI', 'round_shield');
    this.defCapsule.update = function () {
        this.setText(1);
    };

    this.content.forEach(function (c) {
        c.setScrollFactor(0);
        c.setVisible(false);
    });
}

BattleEquipmentPanel.prototype = Object.create(Panel.prototype);
BattleEquipmentPanel.prototype.constructor = BattleEquipmentPanel;

BattleEquipmentPanel.prototype.addLifeBar = function () {
    var lifex = 1000;
    var lifey = 550;
    var lifew = 200;
    var facebg = UI.scene.add.sprite(lifex, lifey, 'UI', 'facebg');
    facebg.flipX = true;
    facebg.flipY = true;
    var lifebg = UI.scene.add.tileSprite(lifex - 22 - lifew / 2, lifey + 4, lifew, 24, 'UI', 'capsule-middle');
    lifebg.flipX = true;
    lifebg.flipY = true;
    var lifetip = UI.scene.add.sprite(lifebg.x - lifew / 2, lifebg.y, 'UI', 'capsule-left');
    lifetip.flipY = true;
    this.content.push(facebg);
    this.content.push(UI.scene.add.sprite(facebg.x, facebg.y, 'faces', 0));
    this.content.push(lifebg);
    this.content.push(lifetip);
    this.content.push(UI.scene.add.sprite(lifetip.x + 5, lifetip.y, 'UI', 'heart'));
    this.lifetext = UI.scene.add.text(lifetip.x + 15, lifetip.y, '100/100',
        {font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3}
    ).setOrigin(0, 0.5);
    this.content.push(this.lifetext);
    this.bar = new MiniProgressBar(this.lifetext.x + this.lifetext.width + 5, lifetip.y - 5, 100, 'red');
    this.bar.setLevel(100, 100);
};

BattleEquipmentPanel.prototype.addEquipmentHolder = function (x, y, addText) {
    var holder = UI.scene.add.sprite(x, y, 'UI', 'battleholder');
    holder.setInteractive();
    holder.on('pointerover', UI.tooltip.display.bind(UI.tooltip));
    holder.on('pointerout', UI.tooltip.hide.bind(UI.tooltip));
    var icon = new ItemSprite(x, y);

    if (addText) {
        icon.countText = UI.scene.add.text(holder.x + 5, holder.y + 5, '0',
            {font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3}
        );
        icon.countText.setVisible(false);
        this.content.push(icon.countText);
    }

    this.content.push(holder);
    this.content.push(icon);
    return icon;
};

BattleEquipmentPanel.prototype.updateStats = function () {
    var hp = Engine.player.getStatValue('hp');
    var hpmax = Engine.player.getStatValue('hpmax');
    this.lifetext.setText(hp + '/' + hpmax);
    this.bar.setLevel(hp, hpmax);
};

BattleEquipmentPanel.prototype.updateEquipment = function () {
    var meleeID = Engine.player.getEquippedItemID('meleew');
    var rangeAmmoID = Engine.player.getEquippedItemID('range_ammo');
    var rangedWeaponID = Engine.player.getEquippedItemID('rangedw');
    var meleeData, rangeData;

    // If ranged weapon, display the actual ammo; else, display the ranged weapon (= the hands)
    var rangeID = (rangeAmmoID == -1 || !Engine.player.hasRangedEquipped()) ? rangedWeaponID : rangeAmmoID;
    meleeData = itemsData[meleeID];
    rangeData = itemsData[rangeID];

    // console.warn(Engine.player.hasRangedEquipped());
    if (Engine.player.hasRangedEquipped()) {
        var ammo = Engine.player.getNbAnyAmmo();
        this.range.countText.setText(ammo);
    }

    this.melee.setUp(meleeID, meleeData);
    this.range.setUp(rangeID, rangeData);
    this.range.countText.setVisible(Engine.player.hasRangedEquipped());
};

BattleEquipmentPanel.prototype.updateCapsules = function () {
    this.atkCapsule.update();
    this.defCapsule.update();
};

BattleEquipmentPanel.prototype.display = function () {
    Panel.prototype.display.call(this);
    this.content.forEach(function (c) {
        c.setVisible(true);
    });
    this.bar.display();
    // this.atkCapsule.display();
    // this.defCapsule.display();
};

BattleEquipmentPanel.prototype.hide = function () {
    Panel.prototype.hide.call(this);
    this.content.forEach(function (c) {
        c.setVisible(false);
    });
    this.bar.hide();
    this.atkCapsule.hide();
    this.defCapsule.hide();
};

export default BattleEquipmentPanel