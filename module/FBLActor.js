import { CONFIG_WEAR_ICONS,
    CONFIG_WOUND_ICONS,
    CONFIG_WILLPOWER_ICONS,
    CONFIG_CONSUMABLE_ICONS,
    CONFIG_DICE_ICONS,
    CONFIG_MONEY } from "./config.js";

    import { fblPool,
        prepareRollData,
        prepareChatData } from "./helper-functions.js";

export class FBLActor extends Actor {
    
    prepareData() {
        // some of these should be moved into the constructor, since they don't ever need to be recomputed
        super.prepareData();
        
        const actorType = this.data.type;

        // prepare attributes current values
        Object.values(this.data.data.attributes).forEach( attribute => {
            attribute.currentValue = attribute.value - attribute.damage;
        });

        // prepare the total skill value and the skill abbreviation to display on the sheet
        Object.values(this.data.data.skills).forEach( skill => {
            const attribute = skill.attr;
            // console.log(skill);
            skill.total = this.data.data.attributes[attribute].currentValue + skill.value;
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
            const quantity = item.data.quantity || 1;
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
        
        data.encumbrance = {};
        data.encumbrance.value = itemsWeight + ( Math.floor( (data.money.gold + data.money.silver + data.money.copper) / 100) * 0.5);
        data.encumbrance.capacity = data.attributes.Strength.value * 2;
    
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
    
    // defines necessary roll dice variables and their defaults
    const attributeDice = rollData.attributeDice || 0; 
    const skillDice  = rollData.skillDice || 0; 
    const gearDice  = rollData.gearDice || 0;
    const artifactDie = rollData.artifactDie || [];
    const attributeName = rollData.attributeName || "";
    const skillName = rollData.skillName || "";
    const itemName = rollData.itemName || "";
    const description = rollData.description || "";
    const canPush = rollData.canPush || false;
    const canPride = rollData.canPride || false;
    const displayData = {"skillName" : skillName, "attributeName": attributeName, "itemName": itemName, "description": description, "canPush": canPush, "canPride": canPride}
  
    // roll the check
    let rollCheck = new fblPool(attributeDice, skillDice, gearDice, artifactDie);
    // console.log(rollCheck);
  
    const chatData = await prepareChatData(rollCheck, rollType, displayData);
    // console.log(chatData);

    chatData.speaker = {actor: actor._id,
                        token: actor.token,
                        alias: actor.name};
  
    let msg = await ChatMessage.create(chatData);
    rollCheck.message_id = msg.data._id;
    // console.log(msg);
    // console.log(rollCheck);
  }
  //------------------------------------------------------------------------------------------------
    
}