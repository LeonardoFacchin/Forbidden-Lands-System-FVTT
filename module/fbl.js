// Import Modules
//import { SimpleItemSheet } from "./item-sheet.js";
import { FBLActor } from "./FBLActor.js";
import { FBLItem } from "./FBLItem.js";
import { FBLActorSheet,
         MonsterSheet,
         PlayerCharacterSheet,
         NonPlayerCharacterSheet,
         StrongholdSheet } from "./FBLActorSheet.js";
import { FBLItemSheet,
         MonsterSpecialAbilitySheet,
         MonsterAttackSheet,
         CharacterTalentSheet,
         SpellSheet,
         EquipmentSheet,
         WeaponSheet,
         ArmorSheet,
         CriticalInjurySheet } from "./FBLItemSheet.js";
import { fblPool, prepareChatData, prepareRollData, pushingRoll, prideRoll } from "./helper-functions.js";
// import { setupTurns, rollAll, rollInitiative, nextRound, nextTurn, FBLCombatTracker } from "./FBLCombatTracking.js";
import { _sortCombatants, rollAll, rollInitiative, nextRound, nextTurn, FBLCombatTracker } from "./FBLCombatTracking.js";
import { FBLChatMessage } from "./FBLRollMessage.js"

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
  console.log(`Initializing FBL System`);

  CONFIG.Actor.entityClass = FBLActor;
  CONFIG.Item.entityClass = FBLItem;
  CONFIG.ChatMessage.entityClass = FBLChatMessage;
  // CONFIG.debug.hooks = true;
  CONFIG.ui.combat = FBLCombatTracker;
  CONFIG.Combat.initiative.decimals = 0;
  Combat.prototype.rollAll = rollAll;
  Combat.prototype._sortCombatants = _sortCombatants;
  Combat.prototype.rollInitiative = rollInitiative;
  Combat.prototype.nextRound = nextRound;
  Combat.prototype.nextTurn = nextTurn;
  Token.prototype._onUpdateTokenActor = _onUpdateTokenActor;
  Token.prototype._onUpdateBaseActor =_onUpdateBaseActor;
  // CONFIG.Actor.sheetClass = FBLActorSheet;

  let dPool = new Collection();
  game.data.fblDicePools = dPool;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);
  Actors.registerSheet("FBL", PlayerCharacterSheet, { types: ["PC"], makeDefault: true});
  Actors.registerSheet("FBL", MonsterSheet, { types: ["Monster"], makeDefault: true});
  Actors.registerSheet("FBL", NonPlayerCharacterSheet, { types: ["NPC"], makeDefault: true});
  Actors.registerSheet("FBL", StrongholdSheet, { types: ["Stronghold"], makeDefault: true});
  Items.registerSheet("FBL", MonsterSpecialAbilitySheet, { types: ["Monster Special Ability"], makeDefault: true });
  Items.registerSheet("FBL", MonsterAttackSheet, { types: ["Monster Attack"], makeDefault: true });
  Items.registerSheet("FBL", CharacterTalentSheet, { types: ["Talent"], makeDefault: true });
  Items.registerSheet("FBL", SpellSheet, { types: ["Spell"], makeDefault: true });
  Items.registerSheet("FBL", EquipmentSheet, { types: ["Equipment"], makeDefault: true });
  Items.registerSheet("FBL", WeaponSheet, { types: ["Weapon"], makeDefault: true });
  Items.registerSheet("FBL", ArmorSheet, { types: ["Armor"], makeDefault: true });
  Items.registerSheet("FBL", CriticalInjurySheet, { types: ["Critical Injury"], makeDefault: true });
  
  // format a string removing all tags and most of the invisible formatting tags
  // when pasting content from PDFs
  Handlebars.registerHelper("formatDisplay", function(content="", options) {
  //  (?:<.*?>) remove html tags
  //  (?:&.*?;) remove PDF endline and formatting tags of the &***; kind
  //  (?:\s+)   remove multiple white spaces
    let stringToStrip = /(?:<.*?>)|(?:&.*?;)|(?:\s\s+)/mg;
    content = content.replace(stringToStrip, " ");
    stringToStrip = /(?:-\s+)/mg;
    content = content.replace(stringToStrip, "");
    // console.log(`${content}`);
    return `${content}`;
  });

  // define an "if" helper that allows for comparison with data entries
  Handlebars.registerHelper("iff", function (variable, options) {
      const comparison = options.hash.comparison;
      if (!comparison && variable) return options.fn(this);
      if (comparison && variable == comparison) return options.fn(this);
      else return options.inverse(this);
  });

  // define an "unless" helper that allows for comparison with data entries
  Handlebars.registerHelper("unlesss", function (variable, options) {
    const comparison = options.hash.comparison;
    if (variable == comparison) {return options.inverse(this)};
    if (!variable || variable !== comparison) {return options.fn(this)};
  });

  // define a helper to just show the first letter of a string
  Handlebars.registerHelper("initial", function(string) {    
    return string = (string.slice(0,1) !== " ") ? string.slice(0,1).toUpperCase(): string;
  });

  // abbreviate a sentence to the first word only
  Handlebars.registerHelper("FirstWord", function(string) {    
    const rexp = /(?:\w*)/;
    return string = string.match(rexp);
  });

   // Radio button selection
   Handlebars.registerHelper("radio", function(name, value) { 
    console.log(name, value);   
    return name === value ? "checked" : ""; 
  });


  game.socket.on("system.forbiddenlands", async data => {
    console.log("Socket Fired");
    switch(data.type) {

      case "toggleFastAction":
        if (game.user.isGM) await game.combats.get(data.combat._id).updateCombatant(data.updateData);
        break;

      case "toggleSlowAction":
        if (game.user.isGM) await game.combats.get(data.combat._id).updateCombatant(data.updateData);
        break;
    }
  });

});

// add event listener to the chat log
Hooks.on( "renderChatLog", async function (cLog) {
  const cLogHtml = document.getElementById("chat-log");

  cLogHtml.addEventListener("click", chatRolls.bind(this));

  function chatRolls(event) {
    const origin = event.target;

    const message_id = origin.dataset.roll_id;
    // console.log("Here we are");
    let msg;
    for (let m of game.messages) { 
      // console.log(m.fblRoll_id, message_id);
      if (m.fblRoll_id === message_id) msg = m };
    
    let fblCustomRoll = msg?.fblRoll;
    // console.log(fblCustomRoll);

    if(!fblCustomRoll) return console.log("This is an old roll and can't be modified anymore");

    if (origin.classList.contains("push")) {
      pushingRoll(fblCustomRoll, origin, msg);
    }
    
    if (origin.classList.contains("pride")) {
      prideRoll(fblCustomRoll, origin, msg);
    }
  }
});

// Add fblPool parsing capabilities to the chat log
// Syntax: /fbl(aDice, sDice, gDice, artDieOne, artDieTwo, ...)
Hooks.on("chatMessage", function (chatLog, chatContent) {    
  let command = chatContent.match("(?<=/fbl[(])(?:.*[^)])");  
  if (!command) return console.log("Quit");  
  command = command[0].replace(/(?:,\s*)/g, ",").split(",");
  let nArtifact = [];
  for (let i = 3; i < command.length; i++) {nArtifact.push(command[i])};
  
  const newRoll = new fblPool(Number(command[0]), Number(command[1]), Number(command[2]), nArtifact);
  const displayData = {"canPush": true, "canPride": true};
  let rollMessage;
  prepareChatData(newRoll, undefined, displayData).then( async chatData => {
    rollMessage = await FBLChatMessage.create(chatData, {}, newRoll);
    // newRoll.message_id = rollMessage._id;
    });
  return false; // prevent the default chat message from being broadcast
})

// Macro Drag and Drop creation hook
Hooks.on("hotbarDrop", async function (hotbar, dropData, slot) {
  const dataType = dropData.type;
  if (dataType === "Talent") return;
  const id = dropData.id;
  const actor = dropData.actor;
  const rollType = dropData.roll;
  const displayName = dropData.isToken ? dropData.token.name : actor.name; // Not working... why isn't the Token name updated?
  const command = `
    const rollType = "${rollType}";
    const id = "${id}";
    const tokensList = canvas.tokens.controlled;
    console.log(tokensList)
    if (tokensList.length != 1) ui.notifications.error("Please, select a single token");
    else {
      const actor = tokensList[0].actor;
      actor.rollCheck(rollType, id);
    }
  `;
  let image;
  if (rollType != "Attribute" && rollType != "Skill") {
    const item = actor.items.find( i => i._id === id);
    image = item.img;
    name = `${displayName} - ${item.name}`;
  }

  if (rollType === "Attribute" || rollType === "Skill") {
    const item = actor.items.find( i => i._id === id);
    image = "/icons/svg/dice-target.svg";
    name = `${displayName} - ${id}`;
  }

  const macroData = {
    name: name,
    type: "script",
    img: image,
    command: command
  }
  
  let macro = await Macro.create(macroData);
  // console.log(macro):
  game.user.assignHotbarMacro(macro, slot);
})

let _onUpdateTokenActor = function _onUpdateTokenActor(updateData) {
  // Reject any calls which were incorrectly placed to this method for tokens which are linked
  if ( !this.actor || this.data.actorLink ) return;

  // Update data for the synthetic Token
  mergeObject(this.actor._data, updateData);
  this.actor._onUpdate(updateData);

  // Update Token bar attributes
  this._onUpdateBarAttributes(updateData);

  // Update tracked Combat resources
  const checkProperty = (game.combats.settings.resource.includes("attributes")) ? true : hasProperty(updateData.data, game.combats.settings.resource);
  if ( this.inCombat && updateData.data && checkProperty ) {
    canvas.addPendingOperation(`CombatTracker.updateTrackedResources`, ui.combat.updateTrackedResources, ui.combat);
    canvas.addPendingOperation(`CombatTracker.render`, ui.combat.render, ui.combat);
  }

  // Render the active Token sheet
  this.actor.sheet.render();
}

let _onUpdateBaseActor = function _onUpdateBaseActor(actorData, updateData) {
  if ( !this.actor ) return;
  // For Tokens which are unlinked, update the synthetic Actor
  if ( !this.data.actorLink ) {
    this.actor.data = mergeObject(actorData, this.data.actorData, {inplace: false});
    this.actor.initialize();
  }
  // Update Token bar attributes
  this._onUpdateBarAttributes(updateData);
  // Update tracked Combat resources
  const checkProperty = (game.combats.settings.resource.includes("attributes")) ? true : hasProperty(updateData.data, game.combats.settings.resource);

  if ( this.inCombat && updateData.data && checkProperty ) {
    // ui.combat.updateTrackedResources();
    ui.combat.render();
  }
  // Render the active Token sheet
  console.log("_onUpdateBaseActor Fired");
  this.actor.sheet.render();
}