import { fblPool, prepareChatData } from "./helper-functions.js"
import { FBLChatMessage } from "./FBLRollMessage.js"

/**
 * Extension of the Dialog class that allows making a generic roll.
 */
export class RollDialog extends Dialog {

  constructor(dialogData, options) {
    super(dialogData, options);
    this.data.buttons = this.getButtons();

    this.actor    = dialogData.actor;
    this.rollName = dialogData.rollName;
    this.base = dialogData.baseDice ?? { name: 'Base', value: 0};
    this.skill = dialogData.skillDice ?? { name: 'Skill', value: 0};
    this.gear = dialogData.gearDice ?? { name: 'Gear', value: 0};
    this.artifact = dialogData.artifactDice ?? {d8: 0, d10: 0, d12: 0};
    this.modifier = dialogData.modifier ?? 0;

    this.onRoll = dialogData.onRoll ?? (() => {});
    this.onCancel = dialogData.onCancel ?? (() => {});

    this.canPush = dialogData.canPush ?? true;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["fbl", "roll-dialog"],
      template: "/systems/forbiddenlands/templates/roll-dialog.html",
      width: 290,
    })
  };

  getData() {
    let data = super.getData();

    data.base = this.base;
    data.skill = this.skill;
    data.gear = this.gear;
    data.artifact = this.artifact;

    data.modifier = (this.modifier >= 0 ? '+' : '') + this.modifier;

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.modifier-plus').click((e) => { this.modifier++; this.render(true); });
    html.find('.modifier-minus').click((e) => { this.modifier--; this.render(true); });

    html.find('.input-dice').change((e) => { 
      let el = $(event.currentTarget);
      let diceType = el.data("dice").split('.');
      if (diceType.length === 1) this[diceType[0]].value = el.val();
      else this[diceType[0]][diceType[1]] = el.val();
    });
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
          let modifier = Number(html.find('.modifier')[0].innerHTML);
          let nArtifact = [].concat(
            new Array(html.find('.input-artifact-8')[0].value).fill('d8'),
            new Array(html.find('.input-artifact-10')[0].value).fill('d10'),
            new Array(html.find('.input-artifact-12')[0].value).fill('d12'),
          );

          const newRoll = new fblPool(Number(base), Number(skill) + modifier, Number(gear), nArtifact);
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
   * @param {Array} artifactDice    {d8: 0, d10: 0, d12: 0}
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