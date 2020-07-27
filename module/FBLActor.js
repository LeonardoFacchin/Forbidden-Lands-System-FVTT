import { CONFIG_WEAR_ICONS,
    CONFIG_WOUND_ICONS,
    CONFIG_WILLPOWER_ICONS,
    CONFIG_CONSUMABLE_ICONS,
    CONFIG_DICE_ICONS,
    CONFIG_MONEY } from "./Config.js";

    import { fblPool,
        prepareRollData,
        prepareChatData } from "./helper-functions.js";

    import { FBLChatMessage } from "./FBLRollMessage.js"

export class FBLActor extends Actor {
    
    prepareData() {
        // some of these should be moved into the constructor, since they don't ever need to be recomputed
        super.prepareData();
        
        const actorType = this.data.type;

        // prepare attributes current values
        Object.values(this.data.data.attributes).forEach( attribute => {
            attribute.value = attribute.max - attribute.damage;
        });

        // prepare the total skill value and the skill abbreviation to display on the sheet
        Object.values(this.data.data.skills).forEach( skill => {
            const attribute = skill.attr;
            // console.log(skill);
            skill.total = this.data.data.attributes[attribute].value + skill.value;
            skill.abbrev = `${attribute.substring(0,1).toUpperCase()}${attribute.substring(1,3)}`;
        });

        if (actorType === "PC") this._preparePCData();
        if (actorType === "Monster") this._prepareMonsterData();
        if (actorType === "NPC") this._prepareNPCData();
    }

    _preparePCData() {
        const data = this.data.data;
        // import configuration arrays
        // define an array of entities that are allowed to be embedded according to this actor type
        // this value is checked for in the overridden _onDrop() method in FBLActorSheet.js
        this.validEmbeddedEntities = ["Talent", "Spell", "Weapon", "Armor", "Equipment", "Critical Injury", "Ailment"];
        
        // filter the embedded entities "items" array by type of embedded entities and
        // sort them into appropriate new arrays for ease of access
        this._prepareEmbeddedArrays();

        // prepare Encumbrance
        // console.log(this);
        const consolidatedInventory = data.Weapon.concat(data.Armor.concat(data.Equipment));
        let consolidatedWeight = [];
        if (consolidatedInventory.length > 0) {
            consolidatedWeight = consolidatedInventory.map( item => {
            const weight = item.data.weight;
            const quantity = item.flags?.forbiddenlands?.quantity || 1;
            if (weight === "Light") return (0.5 * quantity);
            if (weight === "Normal") return (quantity);
            if (weight === "Heavy") return (2 * quantity);
            else return 0;
            });
        }

        let itemsWeight = consolidatedWeight.reduce( (total, w) => { return (total + w) }, 0) || 0;
        Object.entries(data.consumable).forEach( i => {
            itemsWeight = (i[1] !== "dX") ? (itemsWeight + 1) : itemsWeight;
        } );

        let additionalWeight = 0;
        const packRatRank = Number(data.Talent.find( t => t.name === "Pack Rat")?.data.talentRank) || 0;

        if (packRatRank === 1) additionalWeight = 2;
        if (packRatRank === 2) additionalWeight = 5;
        if (packRatRank === 3) additionalWeight = 10;
        
        data.encumbrance = {};
        data.encumbrance.value = itemsWeight + ( Math.floor( (data.money.gold + data.money.silver + data.money.copper) / 100) * 0.5);
        data.encumbrance.capacity = data.attributes.Strength.max * 2 + additionalWeight;
    }

    _prepareMonsterData() {
        // define an array of entities that are allowed to be embedded according to this actor type
        // this value is checked for in the overridden _onDrop() method in FBLActorSheet.js
        this.validEmbeddedEntities = ["Monster Special Ability", "Monster Attack"];
        
        // filter the embedded entities "items" array by type of embedded entities and
        // sort them into appropriate new arrays for ease of access
        this._prepareEmbeddedArrays();
    }

    _prepareNPCData() {
        const data = this.data.data;
        // import configuration arrays
        this.validEmbeddedEntities = ["Talent", "Spell", "Weapon", "Armor", "Equipment", "Critical Injury", "Ailment"];
        // filter the embedded entities "items" array by type of embedded entities and
        // sort them into appropriate new arrays for ease of access
        this._prepareEmbeddedArrays();
    }

    prepareEmbeddedEntities() { 
        super.prepareEmbeddedEntities();
        Object.values(this.data.items).forEach( item => {
            // if the item doesn't have a bonus property, return
            if (!item.data.bonus) return;
            item.data.bonus.currentValue = item.data.bonus.value - item.data.bonus.damage;
        })
    }

    _prepareEmbeddedArrays() {
        //  if no entities are embedded, initialize the arrays and return
        if (!this.data.items) {
            this.data.data.Weapon = [];
            this.data.data.Armor = [];
            this.data.data.Equipment = [];
            this.data.data["Critical Injury"] = [];
            this.data.data.Talent = [];
            this.data.data.Spell = [];
            return;
        }        
        // for each type of embeddedEntity allowed for this type of actor, create the array
        // this.data.data[entityType], fill it with embeddedEntities of that
        // specific type for ease of access and then sort it according to the sort parameter
        this.validEmbeddedEntities.forEach( entityType => {
            this.data.data[entityType] = this.data.items.filter( (item) => item.type === entityType).sort( (item1, item2) => {
                return (item1.sort - item2.sort);
            });
        });
        // console.log(this.data.data.Equipment);
        }

        //----------------  FUNCTION rollCheck(event) ---------------------------------------------------- 
// Roll a generic dice check according to the FBL rules, allowing for the pushing of the roll and/or the
// rolling of the pride die

async rollCheck(rollType, id) {
    const actor = this;
    
    // prepare the data for the fblRoll DicePool class according to the type of roll
    const rollData = await prepareRollData(rollType, actor, id);
    // console.log(rollData);
  
    if (!rollData) return;
    // console.log(rollData);

    const displayData = rollData;
  
    // roll the check
    let rollCheck = new fblPool(rollData.attributeDice, rollData.skillDice, rollData.gearDice, rollData.artifactDie);
    // console.log(rollCheck);
  
    let chatData = await prepareChatData(rollCheck, rollType, displayData);
    // console.log(chatData);

    chatData.speaker = {actor: actor._id,
                        token: actor.token,
                        alias: actor.name};
  
    // let msg = await ChatMessage.create(chatData);
    // msg._roll = rollCheck;
    console.log(chatData);
    let msg = await FBLChatMessage.create(chatData, {}, rollCheck);
    console.log(msg);
    // rollCheck.message_id = msg.data._id;
    // ui.chat.updateMessage(msg, true);
    // console.log(rollCheck);
  }
  //------------------------------------------------------------------------------------------------

  async modifyTokenAttribute(attribute, value, isDelta=false, isBar=true) {
    console.log("modifyTokenAttribute Fired")
    const current = getProperty(this.data.data, attribute);
    // console.log(attribute);
    if ( isBar ) {
      if (isDelta) value = Math.clamped(0, Number(current.value) + value, current.max);
        if (attribute.includes("attributes")) {
            value = current.max - value;
            return await this.update({[`data.${attribute}.damage`]: value});
        }
      else return await this.update({[`data.${attribute}.value`]: value});
    } 
    
    else {
      if ( isDelta ) value = Number(current) + value;
        if (attribute.includes("attributes")) {
            value = current.max - value;
            return await this.update({[`data.${attribute}.damage`]: value});
        }
      else return await this.update({[`data.${attribute}`]: value});
    }
  }
}