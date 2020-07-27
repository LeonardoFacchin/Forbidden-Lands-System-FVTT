import { CONFIG_WEAR_ICONS,
         CONFIG_WOUND_ICONS,
         CONFIG_EXPERIENCE_ICONS,
         CONFIG_WILLPOWER_ICONS,
         CONFIG_CONSUMABLE_ICONS,
         CONFIG_CONDITIONS_ICONS,
         CONFIG_INJURY_STATUS,
         CONFIG_DICE_ICONS,
         CONFIG_DICE_MODIFIERS,
         CONFIG_ARTIFACT_MODIFIERS,
         CONFIG_DICE_ATTRIBUTES,
         CONFIG_DICE_SKILLS,
         CONFIG_DICE_GEAR,
         CONFIG_DICE_ARTIFACT_MIGHTY,
         CONFIG_DICE_ARTIFACT_EPIC,
         CONFIG_DICE_ARTIFACT_LEGENDARY,
         CONFIG_MONEY, 
         CONFIG_MAGIC_DISCIPLINES} from "./Config.js";
        
import { updateDataFromProperty } from "./helper-functions.js";
import { EquipmentSheet } from "./FBLItemSheet.js";

/* ------------------------------ FBLActorSheet ------------------------------------ */
// extension of the ActorSheet class. Not used directly, just for inheritance.

export class FBLActorSheet extends ActorSheet {

// -------------------------- GETDATA -------------------------------------
  getData() {
    let data = super.getData();

    // create the Attributes damage track
    // Object.values(data.data.attributes).forEach(d => this._createTrack(d, CONFIG_WOUND_ICONS));
    Object.values(data.data.attributes).forEach(d => createTrack.call(this, d, ["max","damage"], CONFIG_WOUND_ICONS));
    return data;
  }
// -------------------------- END GETDATA -------------------------------------

// -------------------------- LISTENERS -------------------------------------

  activateListeners(html) {
    super.activateListeners(html);

    // DragDrop Manager to manage item sorting on character sheets
    const itemSortEventManager = new DragDrop({
      dragSelector: ".drag-item",     
      dropSelector: ".drag-target",     
      permissions: {},     
      callbacks: { "dragstart": onDragStart.bind(this), "drop": sortItems.bind(this)}     
      });
    itemSortEventManager.bind(document.querySelector(`.layout.${this.actor._id}`));  
  }
// -------------------------- END LISTENERS -------------------------------------

  // -------------------------- _ONDROP() -------------------------------------
  //  override the _onDrop() method to add logic that checks if the item being dropped is of a valid 
  //  type for this actor and prevents the embedding of the entity if it isn't
   async _onDrop(event) {

      event.preventDefault();
  
      // Try to extract the data    
      let data;
      let validEmbeddedEntities = this.actor.validEmbeddedEntities || [];
  
      try {    
        data = JSON.parse(event.dataTransfer.getData('text/plain'));
        // console.log(data);    
        if (data.type !== "Item") return; 
      } catch (err) {    
        return false;    
      }

      let item;
  
      // Case 1 - Import from a Compendium pack    
      const actor = this.actor;    
      if (data.pack) {  
        const pack = game.packs.get(data.pack);
        if (pack.metadata.entity !== "Item") return;    
        item = await pack.getEntity(data.id);
        console.log("From Compendium", item)  
        }
      // Case 2 - Import from a World Item
      else {    
        item = game.items.get(data.id);
        console.log("From Item", item);
      }    
      if (!item) return;

        // ----------------- Begin overriding  ---------------------
        //  if this actor can't embed this type of entity, return
        if ( !validEmbeddedEntities.includes(item.type) ) {console.log("Invalid"); return};

        let newItem;

        // EQUIPMENT
        // if the item is of type "Equipment" add a "quantity" property
        if ( item.type === "Equipment") {
          let existingItem = Object.values(actor.data.data.Equipment).find( i => i.name === item.name );
          // if the item already exists in the inventory, increase its quantity by 1
          if (existingItem) { 
            let quan = existingItem.flags.forbiddenlands.quantity;
            quan++;
            await actor.updateEmbeddedEntity("OwnedItem", {"_id": existingItem._id, "flags.forbiddenlands.quantity": quan } );
          }
          // otherwise create a new item, set its quantity to 1 and its sorting order to the default
          else {
            newItem = await actor.createEmbeddedEntity("OwnedItem", duplicate(item.data));
            await actor.updateEmbeddedEntity("OwnedItem", {"_id": newItem._id, "sort": (actor.data.items.length-1), "flags.forbiddenlands.quantity": 1 });
            actor.prepareEmbeddedEntities();
          };
          return;
        }
        // CRITICAL INJURY
        if (item.type === "Critical Injury") {
          // roll for healing time and time limit before death
          let timeToHeal = item.data.data.healingTime;
          if (timeToHeal === " - ") return;
          else if (timeToHeal !== "Permanent") {  
            let healingRoll = new Roll(timeToHeal);
            timeToHeal = healingRoll.roll().result;
          }
          else timeToHeal = "Perm";

          let timeToDeath;
          if (item.data.data.lethal.isLethal === "Yes") {
          timeToDeath = item.data.data.timeLimit.value;
          let deathRoll = new Roll(timeToDeath);
          timeToDeath = deathRoll.roll().result;
          }
          else {
            timeToDeath = " - ";
          };
          let injuryData = duplicate(item.data);
          injuryData = mergeObject(injuryData, {"data.healingTime": timeToHeal, "data.timeLimit.value": timeToDeath});
          return await actor.createEmbeddedEntity("OwnedItem", injuryData);
        }
        // TALENT
        if (item.type === "Talent") {
          // define and save Talent rank
          let talentData = duplicate(item.data);
          talentData = mergeObject(talentData, {"data.talentRank": 1});
          let newTalent = await actor.createEmbeddedEntity("OwnedItem", duplicate(item.data));
          actor.updateEmbeddedEntity("OwnedItem", {"_id": newTalent._id, "data": talentData.data});

          // if the talent grants spellcasting capability, add the spells to the Spells tab
          if (talentData.data.isMagical) {
            // console.log("Magic talent Fired");
            const discipline = talentData.data.magicalDiscipline;
            console.log(discipline);
            const spells = (game.items.entries.filter( i => i.type === "Spell"));  // <-------------- !!! Replace this line with Compendium Spell entries once it's done !!!
            let generalSpells = spells.filter( spell => { return ( spell.data.data.discipline === "general") });
            generalSpells.sort( (s1,s2) => {return (s1.data.data.rank - s2.data.data.rank)});
            let spellList = spells.filter( spell => { return (CONFIG_MAGIC_DISCIPLINES[spell.data.data.discipline].name === discipline) });
            spellList.sort( (s1,s2) => {return (s1.data.data.rank - s2.data.data.rank)});
            spellList = generalSpells.concat(spellList);
            spellList = spellList.filter( spell => {return !actor.data.data.Spell.some( s => s.name === spell.name)});
            if (!spellList) return;
            // console.log(spellList);
            let spellData = spellList.map( spell => {return spell.data});
            // add sort property so that spells stay ordered as above
            spellData.forEach( spell => {return (spell.sort = (actor.data.items.length-1+spellData.indexOf(spell) ) )});
            // console.log(spellData);
            spellList = actor.createEmbeddedEntity("OwnedItem", spellData);
            this.actor.update({"data.isSpellcaster": true});
          }
          return;
        }
        // ----------------- End overriding  ---------------------
        newItem = await actor.createEmbeddedEntity("OwnedItem", duplicate(item.data));
        await actor.updateEmbeddedEntity("OwnedItem", {"_id": newItem._id, "sort": actor.data.items.length});
        actor.prepareEmbeddedEntities();
        return;
    }    
    // -------------------------- END _ONDROP() ------------------------------------

  }

// -------------------------- END _ONSORTITEM() -------------------------------------




/* ------------------------------ PlayerCharacterSheet ------------------------------------ */
export class PlayerCharacterSheet extends FBLActorSheet {

	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
  	  classes: ["fbl"],
  	  template: "systems/forbiddenlands/templates/player-character-sheet.html",
      // width: 929,
      // height: 988,
      resizable: false
    });
  }

  getData() {
    let data = super.getData();
    // create the EXPERIENCE track
    createTrack.call(this, data.data.experience, ["max", "value"], CONFIG_EXPERIENCE_ICONS);
    // create the WILLPOWER score track
    createTrack.call(this, data.data.willpower, ["max", "value"], CONFIG_WILLPOWER_ICONS);
    // create the EQUIPMENT wear tracks
    data.data.Weapon.forEach(d => {
      createTrack.call(this, d.data.bonus, ["value", "damage"], CONFIG_WEAR_ICONS);
      if ( d.data.isArtifact ) d.data.artifactUrl = CONFIG_DICE_ICONS[d.data.artifactDie];
    });
    data.data.Armor.forEach(d => {
      createTrack.call(this, d.data.bonus, ["value", "damage"], CONFIG_WEAR_ICONS)
      if ( d.data.isArtifact ) d.data.artifactUrl = CONFIG_DICE_ICONS[d.data.artifactDie]; 
    });
    data.data.Equipment.forEach(d => {
      createTrack.call(this, d.data.bonus, ["value", "damage"], CONFIG_WEAR_ICONS)
      if ( d.data.isArtifact ) d.data.artifactUrl = CONFIG_DICE_ICONS[d.data.artifactDie];
    });
    // create CONDITIONS track
    Object.entries(data.data.conditions).forEach(d => createTrack.call(this, d[1], ["max", "isCondition"], CONFIG_CONDITIONS_ICONS[d[0]]) );
    // create DICE MODIFIERS track
    Object.entries(data.data.dieModifiers).forEach( d => createDieTrack.call(this, d));
    // Object.entries(data.data.dieModifiers).forEach( d => createDieTrack.bind(this, d));
    // create ARTIFACT DICE MODIFIERS track
    Object.entries(data.data.artifactModifiers).forEach( d => createTrack.call(this, d[1], ["max", "value"], CONFIG_ARTIFACT_MODIFIERS[d[0]][d[1].type]) );
    // Object.entries(data.data.artifactModifiers).forEach(d => createTrack.bind(this, d[1], CONFIG_ARTIFACT_MODIFIERS[d[0]]) );
    //configure Icons and Currency
    data.data.Consumables = CONFIG_CONSUMABLE_ICONS;
    data.data.diceIcons = CONFIG_DICE_ICONS;
    data.data.injuryStatus = CONFIG_INJURY_STATUS;
    data.data.currency = Array.from(CONFIG_MONEY).reverse();
    // configure Encumbrance Icon according to encumbrance status
    data.data.isEncumbered = (data.data.encumbrance.value > data.data.encumbrance.capacity) ?  true : false;
    // data.data.isSheetCompressed = this.data
    // console.log(data);
    return data;
  }

  // activate PC Sheet specific listeners
  activateListeners(html){

    super.activateListeners(html);
    // Listener to manage item-related operations: delete, consumables increase or decrese, etc.
    document.querySelectorAll(`form.${this.actor._id}`).forEach( el => el.addEventListener("click", updateTrackData.bind(this)));
    document.querySelector(`form.${this.actor._id}`).querySelectorAll(".fas").forEach(el => el.addEventListener("dblclick", itemEvents.bind(this)));
    document.querySelector(`form.${this.actor._id}`).addEventListener("dblclick", rollCheckHandler.bind(this));
    document.querySelector(`form.${this.actor._id}`).addEventListener("dblclick", rollConsumable.bind(this));
    document.querySelector(`form.${this.actor._id}`).addEventListener("dblclick", woundTreatment.bind(this));
    document.querySelector(`form.${this.actor._id}`).addEventListener("dblclick", showItemSheet.bind(this));
    document.querySelector(`form.${this.actor._id}`).addEventListener("change", changeRank.bind(this));
    document.querySelector(`form.${this.actor._id} .dieMod`).addEventListener("click", updateDieModifier.bind(this));

    //activate tabs
    const tabs = new TabsV2({navSelector: ".tabs", contentSelector: ".content", initial: "talents", callback: ()=>{}});
    tabs.bind(document.querySelector(`form.${this.actor._id}`));
    }  
}
/* ------------------------------  END PlayerCharacterSheet------------------------------------ */

/* ------------------------------ MonsterSheet ------------------------------------ */
export class MonsterSheet extends FBLActorSheet {

  /** @override */
	static get defaultOptions() {

	  return mergeObject(super.defaultOptions, {
  	  classes: ["fbl"],
  	  template: "systems/forbiddenlands/templates/monster-sheet.html",
      width: 900,
      height: 1010,
      // resizable: false
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    document.querySelector(`form.${this.actor._id}`).addEventListener("click", updateTrackData.bind(this));
    document.querySelector(`form.${this.actor._id}`).querySelectorAll(".fas").forEach(el => el.addEventListener("dblclick", itemEvents.bind(this)));
    document.querySelector(`form.${this.actor._id}`).addEventListener("dblclick", rollCheckHandler.bind(this));
    document.querySelector(`form.${this.actor._id} .randomAttack`).addEventListener("dblclick", rollRandomAttack.bind(this));
  }
}
/* ------------------------------ END MonsterSheet ------------------------------------ */

/* ------------------------------ NonPlayerCharacterSheet ------------------------------------ */
export class NonPlayerCharacterSheet extends FBLActorSheet {

  /** @override */
	static get defaultOptions() {

	  return mergeObject(super.defaultOptions, {
  	  classes: ["fbl"],
  	  template: "systems/forbiddenlands/templates/NPC-sheet.html",
      width: 929,
      height: 720,
      // resizable: false
    });
  }

  getData() {
    let data = super.getData();
    // create the EQUIPMENT wear tracks
    data.data.Weapon.forEach(d => {
      createTrack.call(this, d.data.bonus, ["value", "damage"], CONFIG_WEAR_ICONS)
      if ( d.data.isArtifact ) d.data.artifactUrl = CONFIG_DICE_ICONS[d.data.artifactDie];
    });
    data.data.Armor.forEach(d => {
      createTrack.call(this, d.data.bonus, ["value", "damage"], CONFIG_WEAR_ICONS)
      if ( d.data.isArtifact ) d.data.artifactUrl = CONFIG_DICE_ICONS[d.data.artifactDie];
    });
    data.data.Equipment.forEach(d => {
      createTrack.call(this, d.data.bonus, ["value", "damage"], CONFIG_WEAR_ICONS)
      if ( d.data.isArtifact ) d.data.artifactUrl = CONFIG_DICE_ICONS[d.data.artifactDie];
    });
    // create DICE MODIFIERS track
    Object.entries(data.data.dieModifiers).forEach( (d) => createDieTrack.call(this, d));
    // create ARTIFACT DICE MODIFIERS track
    Object.entries(data.data.artifactModifiers).forEach( d => createTrack.call(this, d[1], ["max", "value"], CONFIG_ARTIFACT_MODIFIERS[d[0]][d[1].type]) );
    data.data.injuryStatus = CONFIG_INJURY_STATUS;
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    document.querySelector(`form.${this.actor._id}`).addEventListener("click", updateTrackData.bind(this));
    document.querySelector(`form.${this.actor._id}`).addEventListener("dblclick", rollCheckHandler.bind(this));
    document.querySelector(`form.${this.actor._id}`).querySelectorAll(".fas").forEach(el => el.addEventListener("dblclick", itemEvents.bind(this)));
    document.querySelector(`form.${this.actor._id}`).addEventListener("dblclick", showItemSheet.bind(this));
    document.querySelector(`form.${this.actor._id}`).addEventListener("change", changeRank.bind(this));
    document.querySelector(`form.${this.actor._id}`).addEventListener("dblclick", woundTreatment.bind(this));
    document.querySelector(`form.${this.actor._id} .dieMod`).addEventListener("click", updateDieModifier.bind(this));

    //activate tabs
    const tabs = new TabsV2({navSelector: ".tabs", contentSelector: ".content", initial: "talents", callback: ()=>{}});
    tabs.bind(document.querySelector(".layout--NPC"));
  }
}
/* ------------------------------ END NPCSheet ------------------------------------ */

/* ------------------------------ FUNCTIONS AND EVENTHANDLERS ------------------------------------ */

function createTrack(data, trackNames, iconsURLArray) {
  // console.log(iconsURLArray)
  if (!data) {return};
  const trackTotalLengthName = trackNames[0];                  // get the track length property name
  const trackMarkedLengthName = trackNames[1];                 // get the marked segments length property name
  let trackTotalLength = data[trackTotalLengthName];           // get the track length
  let trackMarkedLength = data[trackMarkedLengthName];         // get the marked segments length
  // create an array that will pass a list of names of svg icons to be rendered to the handlbars template. 
  let dT = [];
  for (let i = 1; i <= (trackMarkedLength); i++) { dT.push(iconsURLArray[0]) };                       // append a number of "marked" icons equal to the number of marked
  for (let i = 1; i <= (trackTotalLength - trackMarkedLength); i++) { dT.push(iconsURLArray[1]) };    // append a number of "unmarked" icons equal to the difference between the total legnth and the marked segments length
  return data = mergeObject(data, {"propertyTrack": dT});        // return the original object after appending the propertyeTrack property
}

  function createDieTrack(modifier) {
  let mod = modifier[1].value;
  let diceModifiers = Array.from(CONFIG_DICE_MODIFIERS[0]);   
  if (mod === 0) {return this.actor.data.data.dieModifiers[modifier[0]] = mergeObject(modifier[1], {"modTrack": diceModifiers})};
  const index = (mod < 0) ? (mod + 3) : ( mod + 2);
  diceModifiers.splice(index, 1, CONFIG_DICE_MODIFIERS[1][index]);
  return this.actor.data.data.dieModifiers[modifier[0]] = mergeObject(modifier[1], {"modTrack": diceModifiers});
}


// updateTrackData() event handler: updates a property value when a player clicks on the track
    // requirements: the icon's <img> HTML element must define:
    //                                       1) a data-trackvalue = "{{@index}}" attribute to store the selected property value
    //                                       2) a name="data.[...].track_property" that tells the handler which property should be updated
    //                                         (ex. name = "data.attributes.strength.damage")
    //                                       3) a data-id="{{item._id}}" that stores the id of the object that should be updated, if any
    //                                          (ex. {{weapon._id}} )
  async function updateTrackData(event) {
    event.preventDefault();
    // get the element the event originated from
    const origin = event.target;
    // get the damage value the player selected
    let newValue = Number(origin.dataset.trackvalue) + 1;
    // if newValue is not a number, return
    if (!newValue) {return};
    // get the object id, if any
    const id = origin.dataset.id;
    // if a valid id is returned then we are dealing with an embeddedEntity, otherwise with the actor itself
    const obj = id ? this.actor.getEmbeddedEntity("OwnedItem", id) : this.actor.data;
    // get the target property string
    const property = origin.name;
    // get the target property old damage value
    const oldValue = getProperty(obj, property);
    // if the newValue equals the old one then reset the damage to zero (the player needs a way to reset the damage when his character is completely healed)
    // otherwise keep the newValue
      newValue =  (newValue === oldValue) ? 0 : newValue;
    // prepare the target property for the update
    let newData = updateDataFromProperty(property, newValue);
      if (id) {
        newData = mergeObject( {"_id": id}, newData);
        await this.actor.updateEmbeddedEntity("OwnedItem", newData);
        this.actor.prepareEmbeddedEntities();
      }
      else { await this.actor.update(newData) }
  }


// -------------------- FUNCTION: itemEvents(event) --------------------------------------
// manage item related events, like deleting or editing.

async function itemEvents(event) {
  event.preventDefault();
  event.stopPropagation();

  const origin = event.target;
  const elementClasses= origin.classList;
  console.log(elementClasses);
  const data = this.getData();
  // console.log(data);

  // DELETE ITEM OPERATIONS
  if (elementClasses.contains("fa-trash")) {
    let id = origin.dataset.id;
    let item = this.actor.getEmbeddedEntity("OwnedItem", id);
    // if item quantity is greater than one then decrese it by one,
    // otherwise delete the item alltogether
    if (item.type === "Equipment") {
      let quan = item.flags?.forbiddenlands?.quantity;
      if (quan == 1 || !quan) { this.actor.deleteEmbeddedEntity("OwnedItem", id); return;}
      quan--;
      return this.actor.updateEmbeddedEntity("OwnedItem", { "_id": id, "flags.forbiddenlands.quantity": quan });
    }
    // if a spellcasting talent is removed, also remove the corresponding spells
    if (item.type === "Talent") {
      if (!item.data.isMagical) {return await this.actor.deleteEmbeddedEntity("OwnedItem", item._id)};
      const discipline = item.data.magicalDiscipline;
      let spellsToDelete = this.actor.data.data.Spell.filter( spell => { return CONFIG_MAGIC_DISCIPLINES[spell.data.discipline].name === discipline });
      spellsToDelete = spellsToDelete.map( spell => spell._id);
      await this.actor.deleteEmbeddedEntity("OwnedItem", spellsToDelete);
      // if it was the last spellcasting talent also remove the General Spells
      if (this.actor.data.data.Spell.every( spell => {return CONFIG_MAGIC_DISCIPLINES[spell.data.discipline].name === "General"})) {
        spellsToDelete = this.actor.data.data.Spell.map( spell => spell._id);
        await this.actor.deleteEmbeddedEntity("OwnedItem", spellsToDelete);
        this.actor.update({"data.isSpellcaster": false});
      }
    }
    return this.actor.deleteEmbeddedEntity("OwnedItem", id);
  }

  // CONSUMABLE UPDATE OPERATIONS
  if (elementClasses.contains("fa-plus-circle") || elementClasses.contains("fa-minus-circle")) {
    let cons = origin.dataset.id;
    let elementClass = elementClasses.contains("fa-plus-circle") ? "fa-plus-circle" : "fa-minus-circle";
    let currentValue = data.data.consumable[cons];
    const diceValues = Object.keys(CONFIG_DICE_ICONS);
    let ind = diceValues.indexOf(currentValue);
    // if the player clicked to increase the quantity and the quantity is not capped
    // increase the quantity by one.
    if (elementClass === "fa-plus-circle" && (ind < diceValues.length) ) {
      ind++;
      const newValue = diceValues[ind];
      await this.actor.update(updateDataFromProperty(`data.consumable.${cons}`, newValue));
      return;
    }
    // if the player clicked to decrease the quantity and the quantity is not capped
    // decrease the quantity by one.
    if (elementClass === "fa-minus-circle" && (ind > 0) ) {
        ind--;
        const newValue = diceValues[ind];
        await this.actor.update(updateDataFromProperty(`data.consumable.${cons}`, newValue));
        return;
    }
  }

  // ARTIFACT DICE OPERATIONS
  if (elementClasses.contains("fa-angle-up") || elementClasses.contains("fa-angle-down")) {
    let mod = origin.dataset.id;
    let elementClass = elementClasses.contains("fa-angle-up") ? "fa-angle-up" : "fa-angle-down";
    let currentValue = data.data.artifactModifiers[mod].type;
    const diceValues = ["d8", "d10", "d12"];
    let ind = diceValues.indexOf(currentValue);
    // if the player clicked to step up the die, step it up
    if (elementClass === "fa-angle-up") {
      ind++;
      ind = ind % 3;
      const newValue = diceValues[ind];
      await this.actor.update(updateDataFromProperty(`data.artifactModifiers.${mod}.type`, newValue));
      return;
    }
    // if the player clicked to step down the die, step it down
    if (elementClass === "fa-angle-down") {
        ind--;
        ind = ind === -1 ? 2 : ind;
        const newValue = diceValues[ind];
        await this.actor.update(updateDataFromProperty(`data.artifactModifiers.${mod}.type`, newValue));
        return;
    }
  }

  // ARTIFACT DIE SWITCH
  if (elementClasses.contains("artifactSwitch")) {
    let item = this.actor.getEmbeddedEntity("OwnedItem", origin.dataset.id);
    console.log(item);
    if (!item.data.artifactArray.every( a => a)) return;
    let newArtifactDie = item.data.artifactDie === item.data.artifactArray[0] ? item.data.artifactArray[1] :item.data.artifactArray[0];
    await this.actor.updateEmbeddedEntity("OwnedItem", {_id: item._id, "data.artifactDie" : newArtifactDie});
  }

  // Resize Sheet
  if (elementClasses.contains("fa-angle-double-down") || elementClasses.contains("fa-angle-double-up")) {
    console.log("fired");
    this.actor.data.data.isSheetCompressed = elementClasses.contains("fa-angle-double-down") ? true : false;
    this.render(true);
    console.log(this.actor);
  }
}

// -------------------- ITEM SORTING EVENT HANDLERS --------------------------------------

// Item sorting event handlers
  // _onDragStart: creates the DataTransfer object {type: item.type, id: item._id}
function onDragStart (event) {
    const el = event.target;  
    const item = this.actor.getEmbeddedEntity("OwnedItem", el.dataset.id);
    const dragData = {  
      type: item ? item.type : null,  
      id: item ? item._id : el.dataset.id,
      actor: this.actor,
      roll: el.querySelector("[data-dieHook]").dataset.diehook
    };      
    console.log(dragData);
    if (this.actor.isToken) dragData.tokenId = this.actor.token.id;  
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));      
}

// sort character sheet items
async function sortItems (event) {
  event.preventDefault();
  const transferData = JSON.parse(event.dataTransfer.getData("text/plain"));
  if (!transferData.type || transferData.type === "Spell") {return};
  // get the drop target element
  const dropTarget = event.target.closest(".drag-item");
  // is it a valid element?
  const targetId = dropTarget ? dropTarget.dataset.id : null;
  if (!targetId) {return};
  // get the target and source items id and type
  const targetData = {id: targetId, type: this.actor.getEmbeddedEntity("OwnedItem", targetId).type}
  // if they are not of the same type then return
  if (transferData.type !== targetData.type) {return console.log("You can't sort items of different type")};
  // copy the items array and sort it according to the actual current order
  let itemsArray = Array.from(this.actor.data.items);
  itemsArray.sort( (i1, i2) => {return (i1.sort-i2.sort) });
  // get the array index of the target and source items
  const transferDataIndex = itemsArray.findIndex( i => i._id === transferData.id );
  const targetDataIndex = itemsArray.findIndex( i => i._id === targetData.id );
  // return a new array removing the source item
  let newItemsArray = itemsArray.filter( i => {
    return (i._id !== transferData.id);
  });
  // insert the source item right before the target item
  newItemsArray.splice(targetDataIndex, 0 , itemsArray[transferDataIndex]);
  // update the sorting order of the embeddedEntities
  const updateData = newItemsArray.map( d=> {
    return {_id: d._id, sort: newItemsArray.indexOf(d) };
  });
  await this.actor.updateEmbeddedEntity("OwnedItem", updateData);
}
//----------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------
//---------------------- FUNCTION changeRank(event) --------------------------------------------
// eventHandler to change the rank of a talent on the PC sheet

async function changeRank(event) {
  event.preventDefault();
  const target = event.target;
  if (!target.classList.contains("talentRank")) return;
  return await this.actor.updateEmbeddedEntity("OwnedItem", {"_id": target.id, "data.talentRank": target.value });
}
// ----------------------------------------------------------------------------------------------

// --------------------- FUNCION updateDieModifier(event) ---------------------------------------
// manage the update of the die modifiers the player can select from the character sheet
async function updateDieModifier(event) {
  event.stopPropagation();
  event.preventDefault();
  // get the element the event originated from
  const origin = event.target;
  const modType = origin.dataset.modtype;
  let newModifier; 
  // get the target property string
  const property = origin.name;
  // get the target property old value
  const oldModifier = getProperty(this.actor.data, property);
  // get the modifier the player selected
  if (modType === "die") {
    let index = Number(origin.dataset.trackvalue);
    newModifier = (index < 3) ? (index - 3) : (index - 2);
  }
  if (modType === "artifact") newModifier = 1;
  // if newValue is not a number, return
  if (!newModifier) {return};
  // if the newValue equals the old one then reset the damage to zero (the player needs a way to reset the damage when his character is completely healed)
  // otherwise keep the newValue
  newModifier =  (newModifier === oldModifier) ? 0 : newModifier;
  // prepare the target property for the update
  let newData = updateDataFromProperty(property, newModifier);
  return await this.actor.update(newData);
}
//------------------------------------------------------------------------------------------------

//----------------  FUNCTION rollCheckHandler(event) ---------------------------------------------------- 
// Roll a generic dice check according to the FBL rules, allowing for the pushing of the roll and/or the
// rolling of the pride die

async function rollCheckHandler(event) {
  event.preventDefault();
  // event.stopPropagation();

  const origin = event.target;
  if (origin.dataset.action !== "roll") return console.log("Not a roll");

  const rollType = origin.dataset.diehook;
  const id = origin.dataset.id;

  this.actor.rollCheck(rollType, id);
}
//------------------------------------------------------------------------------------------------

//----------------  FUNCTION rollConsumable(event) ---------------------------------------------------- 
// Roll a Consumable resource die and decrease the value of the consumable if the result is 1 or 2.
// Then post a notification to the chat log

async function rollConsumable(event) {
  const origin = event.target;
  const consumableType = origin.dataset.id;
  const actor = this.actor;
  
  if (origin.dataset.action !== "roll") return;
  
  const die = actor.data.data.consumable[consumableType];
  if (die === "dX" || !die) return;
  
  const r = new Roll(die);
  r.roll();
  let dieResult;
  if ( die === "d6") dieResult = CONFIG_DICE_ATTRIBUTES[r.result - 1];
  if ( die === "d8") dieResult = CONFIG_DICE_ARTIFACT_MIGHTY[r.result - 1];
  if ( die === "d10") dieResult = CONFIG_DICE_ARTIFACT_EPIC[r.result - 1];
  if ( die === "d12") dieResult = CONFIG_DICE_ARTIFACT_LEGENDARY[r.result - 1];
  
  let chatData = {
    "consumable": consumableType,
    "dieResult": dieResult,
    "passed": true
  }

  if ( Number(r.result) <= 2) {
    const eventTarget = origin.parentNode.parentNode.querySelector(".fa-minus-circle")
    const synthEvent = new Event("dblclick", {
      target: eventTarget,
    });
    eventTarget.dispatchEvent(synthEvent);
    chatData.passed = false;
  }

  const temp = await getTemplate("/systems/forbiddenlands/templates/consumable-rolling.html");
  chatData = temp(chatData);
  ChatMessage.create({content: chatData});
}

//------------------------------------------------------------------------------------------------

//----------------  FUNCTION woundTreatment(event) ---------------------------------------------------- 
// Manage the transition between injuries states Lethal -> Untreated -> Treated

async function woundTreatment(event) {
  event.preventDefault();
  event.stopPropagation();

  const origin = event.target;
  if (origin.dataset.action !== "treat") return;
  const id = origin.dataset.id;
  const injury = this.actor.getEmbeddedEntity("OwnedItem", id);
  
  if (injury.data.isTreated) return;

  if (injury.data.lethal.isLethal === "Yes") {
    return await this.actor.updateEmbeddedEntity("OwnedItem", {"_id": id, "data.lethal.isLethal": false} );
  }

  return await this.actor.updateEmbeddedEntity("OwnedItem", {"_id": id, "data.isTreated": true, "data.healingTime": Math.round(Number(injury.data.healingTime)/2) || "Perm" });
}

//----------------  FUNCTION showItemSheet(event) ---------------------------------------------------- 
// When the player double clicks on an item icon, launch that item sheet application.

function showItemSheet(event) {
  event.preventDefault();
  event.stopPropagation();

  const origin = event.target;
  if(origin.dataset.action !== "show-item") return
  const id = origin.dataset.id;

  const item = this.actor.items.get(id);

  item.sheet.render(true);
}

//----------------  FUNCTION rollRandomAttack(event) ---------------------------------------------------- 
// Randomly choose a monster attack and roll it

function rollRandomAttack(event) {
  event.preventDefault();
  event.stopPropagation();

  const origin = event.target;
  if(origin.dataset.action !== "random-attack") return
  
  const actor = this.actor;
  const newRoll = new Roll("d6");
  newRoll.roll();
  let randomAttackID = actor.data.data["Monster Attack"][newRoll.result - 1]._id;
  actor.rollCheck("Monster-attack", randomAttackID)
  return;
}