import { fblPool, prepareChatData } from "./helper-functions.js"
import { FBLChatMessage } from "./FBLRollMessage.js"

/**
 * Extension of the Dialog class that allows making a generic roll.
 */
export class RollDialog extends Dialog {

  constructor(dialogData, options) {
    super(dialogData, options);

    this.actor    = dialogData.actor;
    this.rollName = dialogData.rollName;
    this.base = dialogData.baseDice ?? { name: 'Base', value: 0};
    this.skill = dialogData.skillName ?? { name: 'Skill', value: 0};
    this.gear = dialogData.gearName ?? { name: 'Gear', value: 0};
    this.artifactDice = dialogData.artifactDice ?? [];
    this.modifier = dialogData.modifier ?? 0;

    this.onRoll = dialogData.onRoll ?? (() => {});
    this.onCancel = dialogData.onCancel ?? (() => {});

    this.canPush = dialogData.canPush ?? true;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["fbl"],
      template: "/systems/forbiddenlands/templates/roll-dialog.html"
    })
  };

  getData() {
    let data = this.data;

    // override buttons
    data.buttons = this.getButtons();
    data.base = this.base;
    data.skill = this.skill;
    data.gear = this.gear;
    data.artifactDice = this.artifactDice;
    data.modifier = (this.modifier >= 0 ? '+' : '') + this.modifier;

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
  }

  getButtons() {
    return {
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: this.onCancel
      },
      roll: {
        icon: '<i class="fas fa-check"></i>',
        label: "Roll",
        callback: (html) => {
          let base = html.find('.input-base')[0].value;
          let skill = html.find('.input-skill')[0].value;
          let gear = html.find('.input-gear')[0].value;
          let nArtifact = [];

          const newRoll = new fblPool(Number(base), Number(skill), Number(gear), nArtifact);
          const displayData = {
            canPush: this.canPush, 
            canPride: true,
            attributeName: this.base.name,
            skillName: this.skill.name,
            itemName: this.gear.name,
            description: this.rollName,
          };
          prepareChatData(newRoll, undefined, displayData).then( async chatData => {
            chatData.speaker = {actor: this.actor};
            await FBLChatMessage.create(chatData, {}, newRoll);
          });

          this.onRoll(newRoll);
        } 
      },
    }
  }

  /**
   * A helper factory method to create a roll dialog.
   *
   * @param {Actor} rollingActor    Actor that makes the roll
   * @param {string} rollName       Name of the roll (e.g. skill name or custom string like "Hunt Prey")
   * @param {object} baseDice       {name: "Base": value: 0}
   * @param {object} skillDice      {name: "Skill": value: 0}
   * @param {object} gearDice       {name: "Gear": value: 0}
   * @param {Array} artifactDice    Array of artifact dice. E.g. [8, 10, 12].
   * @param {number} modifier       Skill dice modifier
   * 
   * @param {Function} onRoll       Callback function upon Roll
   * @param {Function} onCancel     Callback function upon Cancel
   * 
   * @param {boolean} canPush       Whether roll can be pushed
   *
   * @return {Promise}              A promise which resolves once the user makes a choice or closes the window
   */
  static async show(
    {rollingActor, rollName, baseDice, skillDice, gearDice, artifactDice, modifier}, 
    {onRoll, onCancel}={}, 
    canPush = true
  ) {
    return new Promise(resolve => {
      const dialog = new this({
        actor: rollingActor,
        rollName: rollName,
        baseDice: baseDice,
        skillDice: skillDice,
        gearDice: gearDice,
        artifactDice: artifactDice,
        modifier: modifier,

        onRoll: onRoll,
        onCancel: onCancel,

        canPush: canPush,

        title: 'Roll: ' + rollName,
        default: "roll",
        close: resolve
      });
      
      dialog.render(true);
    });
  }
}