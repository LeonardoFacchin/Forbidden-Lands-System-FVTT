// Import Modules
//import { SimpleItemSheet } from "./item-sheet.js";
import { FBLActor } from "./FBLActor.js";
import { FBLItem } from "./FBLItem.js";
import { FBLActorSheet,
         MonsterSheet,
         PlayerCharacterSheet,
         NonPlayerCharacterSheet } from "./FBLActorSheet.js";
import { FBLItemSheet,
         MonsterSpecialAbilitySheet,
         MonsterAttackSheet,
         CharacterTalentSheet,
         SpellSheet,
         EquipmentSheet,
         WeaponSheet,
         ArmorSheet,
         CriticalInjurySheet } from "./FBLItemSheet.js";
import { fblPool, prepareChatData, prepareRollData, pushingRoll, prideRoll, FBLCombatTracker } from "./helper-functions.js";
import { setupTurns, rollAll, rollInitiative, nextRound, nextTurn } from "./combatOverride.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
  console.log(`Initializing FBL System`);

  CONFIG.Actor.entityClass = FBLActor;
  CONFIG.Item.entityClass = FBLItem;
  // CONFIG.debug.hooks = true;
  CONFIG.ui.combat = FBLCombatTracker;
  Combat.prototype.rollAll = rollAll;
  Combat.prototype.setupTurns = setupTurns;
  Combat.prototype.rollInitiative = rollInitiative;
  Combat.prototype.nextRound = nextRound;
  Combat.prototype.nextTurn = nextTurn;
  // CONFIG.Actor.sheetClass = FBLActorSheet;

  let dPool = new Collection();
  game.data.fblDicePools = dPool;

	/**
	 * Set an initiative formula for the system
	 * @type {String} */
	 
	//  CONFIG.Combat.initiative = {
	//  formula: "1d20",
  //  decimals: 2
  //  };

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);
  Actors.registerSheet("FBL", PlayerCharacterSheet, { types: ["PC"], makeDefault: true});
  Actors.registerSheet("FBL", MonsterSheet, { types: ["Monster"], makeDefault: true});
  Actors.registerSheet("FBL", NonPlayerCharacterSheet, { types: ["NPC"], makeDefault: true});
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

//   // console.log(game.socket);
//   game.socket.on("upAction", async function(data) {
//     console.log("socket fired");
//   if (!game.user.isGM) return;
//   const combatTracker = data.combatTracker;
//   const actionType = data.actionType;
//   if (actionType === "fastAction") {return await combatTracker.combat.updateCombatant({_id: data._id, fastActionSpent: data.fastActionSpent})};
//   if (actionType === "slowAction") {return await combatTracker.combat.updateCombatant({_id: data._id, slowActionSpent: data.slowActionSpent})} 
// })

});


// add event listener to the chat log
Hooks.on( "renderChatLog", async function (cLog) {

  const cLogHtml = document.getElementById("chat-log");

  cLogHtml.addEventListener("click", chatRolls.bind(this));

  function chatRolls(event) {
    const origin = event.target;
    // retrieve last chatlog message
    const roll_id = origin.dataset.roll_id;
    let fblCustomRoll = game.data.fblDicePools.get(roll_id);
    if(!fblCustomRoll) return console.log("This is an old roll and can't be modified anymore");

    if (origin.classList.contains("push")) {
      pushingRoll(fblCustomRoll, origin);
    }
    
    if (origin.classList.contains("pride")) {
      prideRoll(fblCustomRoll, origin);
    }
  }
});

// add event listener to the spellDialog
Hooks.on("renderSpellDialog", async function(dialog) {
  document.querySelector(`.spellCastForm`).addEventListener("input", updateSpellValues.bind(dialog));
  document.querySelector(`.confirmSpellCasting`) ? document.querySelector(`.confirmSpellCasting`).addEventListener("click", submitCastingData.bind(dialog)) : console.log("No Button");
  // document.querySelector(`.confirmSpellCasting`).addEventListener("click", submitCastingData.bind(dialog));
  // console.log("the eventListener was successfully added");

  function updateSpellValues(event) {
    const origin = event.target;
    // console.log(origin.tagName);
    // console.log(origin)
    if (origin.tagName === "SELECT") setProperty(dialog, `${event.target.name}`, event.target.value);
    if (origin.tagName === "INPUT") getProperty(dialog, `${event.target.name}`) === false ? setProperty(dialog, `${event.target.name}`, true) : setProperty(dialog, `${event.target.name}`, false);
    dialog.getData();
    // console.log(dialog);
    dialog.render(true);
  }

  async function submitCastingData(event) {
    const spellDice = dialog.data.rolledDice;
    const castingRoll = new fblPool(spellDice, 0, 0, []);
    // console.log(dialog.data.spellName);
    if (dialog.actor.isPC) {
      let willpower = dialog.actor.data.data.willpower.score;
      willpower = willpower - dialog.data.spentWillpower;
      dialog.actor.update({"data.willpower.score": willpower});
    }
    // console.log(dialog.actor);
    const dialogData = {"spellName": dialog.data.spellName, "powerLevel": dialog.data.powerLevel, "description": dialog.data.description}
    // console.log(dialog.data.spellName);
    const chatData = await prepareChatData(castingRoll, dialog.type, dialogData);
    dialog.close();
    await ChatMessage.create(chatData);
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
  prepareChatData(newRoll).then( chatData => ChatMessage.create(chatData) );
  return false; // prevent the default chat message to be broadcast
})

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
  console.log(macro)
  game.user.assignHotbarMacro(macro, slot);
})