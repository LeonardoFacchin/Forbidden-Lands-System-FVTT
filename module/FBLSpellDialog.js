import { CONFIG_MAGIC_DISCIPLINES } from "./Config.js"

import { fblPool, prepareChatData } from "./helper-functions.js"

// ------------------------------------------------------------------------------------------------
// ---------------------- spellDialog: Forbidden Lands spell dialog extension ---------------------
// ------------------------------------------------------------------------------------------------
// extension of the Dialog class that manages the creation and update of the spell casting dialog.
// The HTML dialog needs to dynamically update the spell Power Level and the spell Rank according
// to choices made by the player, like the use of ingredients or Grimoires/scrolls.
// For this reason the dialog needs to store and dynamically re-compute data. 
export class SpellDialog extends Dialog {

    constructor(dialogData, options) {
      super(dialogData, options);
     //  console.log(dialogData);
      
      const actor = dialogData.actor;
      const spell = actor.getEmbeddedEntity("OwnedItem", dialogData.ID);
 
      this.actor = actor;
      this.spell = spell;
      this.type = dialogData.rollType;
      this.dialogID = randomID();
      this.data.spellName = spell.name;
      this.data.description = spell.data.description;
      this.data.spentWillpower = 1;
      this.data.rolledDice = this.data.spentWillpower;
      this.data.powerLevel = this.data.spentWillpower;
      this.data.isGrimoire = false;
      this.data.isIngredient = false;
      this.data.spellRank = Number(spell.data.rank);
      //  console.log(CONFIG_MAGIC_DISCIPLINES[spell.data.discipline].name);
      // if casting a General spell, get the highest Magical Discipline talent rank of this character
      if(CONFIG_MAGIC_DISCIPLINES[spell.data.discipline].name === "General") {
        this.data.talentRank = actor.data.data.Talent.map( t => { return t.data.isMagical ? Number(t.data.talentRank) : 0}).reduce( (higher, t) => {
         return higher = (t > higher) ? t : higher;
        }, 0);
      }
      // otherwise get the talent rank of the Magical Discipline that matches the one of the spell being cast.
      else this.data.talentRank = Number(actor.data.data.Talent.find( d => { 
         return d.data.magicalDiscipline === CONFIG_MAGIC_DISCIPLINES[spell.data.discipline].name;
       }).data.talentRank);
     //  console.log(this.data.talentRank);
       this.data.mishapChance;
    }
 
    static get defaultOptions() {
     return mergeObject(super.defaultOptions, {
       classes: ["fbl"],
       template: "/systems/forbiddenlands/templates/cast-spell.html"
     })
    };
 
    getData() {
     let data = this.data;
     const actor = this.actor;
     data.isIngredient ? data.powerLevel = Number(data.spentWillpower) + 1 : data.powerLevel = data.spentWillpower;
     data.isGrimoire ? data.spellRank = Math.max(0, this.spell.data.rank - 1) : data.spellRank = this.spell.data.rank;
     // console.log("spellRank: ", data.spellRank);
     // console.log("talentRank: ", data.talentRank);
     data.isChanceCasting = (data.spellRank == (data.talentRank + 1)) ? true : false;
     // console.log(data.isChanceCasting);
     data.isTooHigh =  (data.spellRank > data.talentRank + 1) ? true : false;
     // console.log(data.isTooHigh);
     const minDice = Math.max( 0, data.spentWillpower - Math.max(0, data.talentRank - data.spellRank) );
     // console.log(minDice);
     let WP = actor.isPC ? actor.data.data.willpower.score : data.talentRank;
     const WPArray = [];
     const diceToRoll = [];
     for (let i = 1; i <= WP; i++) { WPArray.push(i)};
     for (let i = minDice; i <= data.spentWillpower; i++) { diceToRoll.push(i)};
     this.data.rolledDice = Math.max(minDice, this.data.rolledDice);
     this.data.mishapChance = data.isChanceCasting ? 100 : Math.round((1 - Math.pow(5/6, this.data.rolledDice))*10000)/100;
     // console.log(this.data);
 
     data = mergeObject( data, { "WPArray": WPArray, "diceToRoll": diceToRoll, "uID": this.dialogID});
     return data;
    }
 
    activateListeners(html) {
     super.activateListeners(html);
     document.querySelector(`.spellCastForm`).addEventListener("input", updateSpellValues.bind(this));
     document.querySelector(`.confirmSpellCasting`) ? document.querySelector(`.confirmSpellCasting`).addEventListener("click", submitCastingData.bind(this)) : console.log("No Button");
     // document.querySelector(`.confirmSpellCasting`).addEventListener("click", submitCastingData.bind(dialog));
     // console.log("the eventListener was successfully added");
   
     function updateSpellValues(event) {
       const origin = event.target;
       // console.log(origin.tagName);
       // console.log(origin)
       if (origin.tagName === "SELECT") setProperty(this, `${event.target.name}`, event.target.value);
       if (origin.tagName === "INPUT") getProperty(this, `${event.target.name}`) === false ? setProperty(this, `${event.target.name}`, true) : setProperty(this, `${event.target.name}`, false);
       this.getData();
       // console.log(dialog);
       this.render(true);
     }
   
     async function submitCastingData(event) {
       const spellDice = this.data.rolledDice;
       const castingRoll = new fblPool(spellDice, 0, 0, []);
       // console.log(dialog.data.spellName);
       if (this.actor.isPC) {
         let willpower = this.actor.data.data.willpower.score;
         willpower = willpower - this.data.spentWillpower;
         this.actor.update({"data.willpower.score": willpower});
       }
       // console.log(dialog.actor);
       const dialogData = {"spellName": this.data.spellName, "powerLevel": this.data.powerLevel, "description": this.data.description}
       // console.log(dialog.data.spellName);
       const chatData = await prepareChatData(castingRoll, this.type, dialogData);
       this.close();
       await ChatMessage.create(chatData);
     }
    }
 }