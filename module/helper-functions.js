import { CONFIG_DICE_ATTRIBUTES,
         CONFIG_DICE_SKILLS,
         CONFIG_DICE_SKILLS_NEGATIVE,
         CONFIG_DICE_GEAR,
         CONFIG_DICE_ARTIFACT_MIGHTY,
         CONFIG_DICE_ARTIFACT_EPIC,
         CONFIG_DICE_ARTIFACT_LEGENDARY } from "./Config.js"

import { SpellDialog } from "./FBLSpellDialog.js"

// creates a data structure from a property
// useuful to update actors and embeddedEntities
export function  updateDataFromProperty(property, value) {
    let data = property.split(".");
    data = data.reverse().reduce( (obj, prop) => {
        return { [prop]: obj }
    }, value);
    // console.log(data);
    return data;
  }

// ------------------------------------------------------------------------------------------------
// ---------------------- fblPool: Forbidden Lands dice rolling class -----------------------------
// ------------------------------------------------------------------------------------------------

export class fblPool extends DicePool {
    // Define base roll functionality
    constructor (nAttribute, nSkill, nGear, nArtifact=[]) {
      // const r1 = (nAttribute!==0) ? new Roll(`${nAttribute}d6`) : new Roll("0d6");
      // const r2 = (nSkill!==0) ? new Roll(`${Math.abs(nSkill)}d6`) : new Roll("0d6");
      // const r3 = (nGear!==0) ? new Roll(`${nGear}d6`) : new Roll("0d6");
      const r1 = new Roll(`${nAttribute}d6`);
      const r2 = new Roll(`${Math.abs(nSkill)}d6`);
      const r3 = new Roll(`${nGear}d6`);
      const allRolls = [r1, r2, r3].concat(nArtifact.map( d => {return new Roll(d)}));
      let r = super(allRolls);

      if (nSkill < 0) this.isSkillNegative = true;
      
      // assign an ID
      this._id = randomID();

      // prepare the property to store the id of the ChatMessage displaying this roll
      this.message_id;

      this.artifactArray = nArtifact;

      // console.log(r.roll());
      
      this.originalRoll = Object.values(r.roll())[0].map( d => {
        if(d.dice.length===0) return [];
        return d.dice[0].rolls.map(i => i.roll)
      });
    //   console.log(this.originalRoll);

      this.res = duplicate(this.originalRoll);
    //   console.log(this.res)

      this.sequence = [this.originalRoll];
    //   console.log(this.sequence.length)

      // store this pool in a collection for later reference by the chat message interface
      game.data.fblDicePools.set(this._id, this);
    }
    
    // Push the roll
    pushRoll() {
      this.res[0] = this.res[0].map( d => { return ((d===1 || d===6) ? d : (new Die(6).roll()).rolls[0].roll) });
    //   console.log(this.res[0]);
      this.res[1] = this.res[1].map( d => { return((d===6) ? d : (new Die(6).roll()).rolls[0].roll) });
    //   console.log(this.res[1]);
      this.res[2] = this.res[2].map( d => { return((d===1 || d===6) ? d : (new Die(6).roll()).rolls[0].roll) });
    //   console.log(this.res[2]);
      for (let i = 3; i <= (this.res.length-1); i++) {
        const dFaces = this.dice[i].faces;
        const dResult = this.res[i][0]
        this.res[i] = (dResult>=6) ? [dResult] : [(new Die(dFaces).roll()).rolls[0].roll];
      }
      this.sequence.push(duplicate(this.res));
      // console.log(this.sequence);
      return this;
    }

    // roll the d12 Pride die
    rollPride() {
      let prideRoll = duplicate(this.sequence).pop();
      prideRoll.push([(new Die(12).roll()).rolls[0].roll]);
      this.sequence.push(duplicate(prideRoll));
      this.artifactArray.push("d12");
      this.res = prideRoll;
      this.dice.push({faces: 12});
      return this;
    }

    // report on the number of successes and the damage to attributes and gear for pushing
    get report() {
      const iter = duplicate(this.sequence).pop();
    //   console.log(iter);

      const tRoll = countResult.bind(this)(iter);
      const tSucc = tRoll.reduce( (sum, i) => {
        return sum = i.success + sum;
      }, 0);
      const tAttDam = (this.sequence.length === 1)? 0 : tRoll[0].damage;
      const tGearDam = (this.sequence.length === 1)? 0 : tRoll[2].damage;

      return { "successes": Math.max(0, tSucc), "attDamage": tAttDam, "gearDamage": tGearDam }

      function countResult(iter) {
        // console.log(iter);
        return iter.map( k => {
          let success = k.reduce( (sum, i) => {
            return sum = (i>=6) ? (sum + (Math.floor(i/2) - 2) ) : sum;
          }, 0);
          if (this.isSkillNegative && iter.indexOf(k)===1) { success = -success }
          
          let failure;
          if (iter.indexOf(k)===0 || iter.indexOf(k)===2) {
            failure = k.reduce( (sum, i) => {
              return sum = (i===1) ? (sum+1) : sum;
            }, 0);
          }
          
          return {"success": success, "damage": failure}
        });
      }
    }
}

// ------------------------------------------------------------------------------------------------
// ---------------------- Forbidden Lands prepareRollData() --------------------------
// ------------------------------------------------------------------------------------------------

export async function prepareRollData( rollType, actor, id) {

  //-------------- Equipment or Weapon ------------------------------
  if ( rollType==="Weapon" || rollType==="Equipment") {
    const item = actor.getEmbeddedEntity("OwnedItem", id);
    if (item.data.skill === "None") {console.log("This Item can't be used in a check"); return null};
    const skill = item.data.skill;
    const attribute = actor.data.data.skills[item.data.skill].attr;
    const itemName = item.name;
    const gearDice = item.data.bonus.currentValue;
    let artifactDie = (item.data.isArtifact) ? [item.data.artifactDie] : [];
    let skillDice = actor.data.data.skills[item.data.skill].value;
    const attributeDice = actor.data.data.attributes[attribute].value;
    const dieModifiers = actor.data.data.dieModifiers;
    const artifactModifiers = actor.data.data.artifactModifiers;
    const skillDieModifier = dieModifiers ? dieModifiers.modifierOne.value + dieModifiers.modifierTwo.value : 0;
    const artModifiers = artifactModifiers ? Object.values(artifactModifiers).filter( a => a.value === 1).map( a => a.type ) : [];
    artifactDie = artifactDie.concat(artModifiers); 
    skillDice = skillDice + skillDieModifier;
    return {
            "canPush": true,
            "canPride": true,
            "skillName" : skill,
            "attributeName": attribute,
            "itemName": itemName,
            "attributeDice": attributeDice,
            "skillDice": skillDice,
            "gearDice": gearDice, 
            "artifactDie": artifactDie}
  }

  //----------------------- Armor ------------------------------
  if ( rollType==="Armor" ) {
    const bodyArmor = actor.data.data.Armor.filter( a => { return a.data.location === "Body"})[0];      
    const headArmor = actor.data.data.Armor.filter( a => { return a.data.location === "Head"})[0];
    const bodyArmorValue = bodyArmor ? bodyArmor.data.bonus.currentValue : 0;
    const headArmorValue = headArmor ? headArmor.data.bonus.currentValue : 0;
    // console.log(bodyArmor)
    const artifactBodyDie = (bodyArmor.data.isArtifact) ? [bodyArmor.data.artifactDie] : [];
    const artifactHeadDie = (headArmor.data.isArtifact) ? [headArmor.data.artifactDie] : [];
    const artifactDie = artifactBodyDie.concat(artifactHeadDie);

    const gearDice = bodyArmorValue + headArmorValue;
    const dieModifiers = actor.data.data.dieModifiers;
    const skillDieModifier = dieModifiers ? dieModifiers.modifierOne.value + dieModifiers.modifierTwo.value : 0;
    const attributeDice = skillDieModifier;
    return {"skillName" : "Armor",
            "attributeDice": attributeDice,
            "skillDice": 0,
            "gearDice": gearDice,
            "artifactDie": artifactDie
          }
  }

  //----------------------- Skill ------------------------------
  if ( rollType==="Skill" ) {
    const skill = id;
    // console.log(skill);
    const attribute = actor.data.data.skills[skill].attr;
    let skillDice = actor.data.data.skills[skill].value;
    const dieModifiers = actor.data.data.dieModifiers;
    const skillDieModifier = dieModifiers ? dieModifiers.modifierOne.value + dieModifiers.modifierTwo.value : 0;
    skillDice = skillDice + skillDieModifier;
    const artifactModifiers = actor.data.data.artifactModifiers;
    const attributeDice = actor.data.data.attributes[attribute].value;
    const artModifiers = artifactModifiers ? Object.values(artifactModifiers).filter( a => a.value === 1).map( a => {return a.type} ) : [];
    return {"canPush": true,
            "canPride": true,
            "skillName" : skill,
            "attributeName": attribute,
            "attributeDice": attributeDice,
            "skillDice": skillDice,
            "gearDice": 0,
            "artifactDie": artModifiers
          }
  }
  
  //----------------------- Attribute ------------------------------
  if ( rollType==="Attribute" ) {
    const attribute = id;
    const attributeDice = actor.data.data.attributes[attribute].value;
    const dieModifiers = actor.data.data.dieModifiers;
    const skillDieModifier = dieModifiers ? dieModifiers.modifierOne.value + dieModifiers.modifierTwo.value : 0;
    const skillDice = skillDieModifier; 
    const artifactModifiers = actor.data.data.artifactModifiers;
    const artModifiers = artifactModifiers ? Object.values(artifactModifiers).filter( a => a.value === 1).map( a => a.type ) : []; 
    return {"canPush": true,
            "canPride": true,
            "attributeName": attribute,
            "attributeDice": attributeDice,
            "skillDice": skillDice,
            "gearDice": 0,
            "artifactDie": artModifiers
    }
  }

  //----------------------- Spell ------------------------------
  if ( rollType==="Spell" ) {
    
    if(Number(actor.data.data.willpower?.score) === 0) {ui.notifications.error("You need to have at least 1 Willpower point to cast a spell"); return null}

    let diag = new SpellDialog ({
      actor: actor,
      ID: id,
      rollType: rollType}).render(true);

    await diag.render(true);
    return null; // transfer control of the spellcasting process to the Spell dialog
  }

  //----------------------- Monster Attack ------------------------------
  if (rollType === "Monster-attack") {
    const attack = actor.getEmbeddedEntity("OwnedItem", id);
    const attackName = attack.name;
    const attributeDice = attack.data.stats.dice;
    return {"skillName" : attackName,
            "weaponDamage": attack.data.stats.damage,
            "description": attack.data.description,
            "attributeDice": attributeDice,
            "skillDice": 0,
            "gearDice": 0,
            "artifactDie": []
    }
  }

  //----------------------- Monster Armor ------------------------------
  if (rollType === "Monster-armor") {
    const armorDice = actor.data.data.armor;
    return {
      "skillName": `Armor`,
      "attributeDice": armorDice,
      "skillDice": 0,
      "gearDice": 0,
      "artifactDie": []
    }
  }
}

// ------------------------------------------------------------------------------------------------
// ---------------------- Forbidden Lands chat-rolling related functions --------------------------
// ------------------------------------------------------------------------------------------------

export async function prepareChatData(fblCustomRoll, rollType=undefined, displayData=undefined, update=false, origin=null) {
  const temp = await getTemplate("/systems/forbiddenlands/templates/dice-rolling.html");
  let chatData;
  let roll = fblCustomRoll;
  const artifactArray = roll.artifactArray;
  const diceResult = roll.report;
  const rollResult = duplicate(roll.sequence);
  const diceIcons = rollResult.map( r => prepareDiceIcons(r, artifactArray, roll.isSkillNegative));

  if (update) {
    chatData = {
      "canPush": displayData ? displayData.canPush : false,
      "canPride": displayData ? displayData.canPride : false,
      "roll_id": origin?.dataset.roll_id,
      "rolledAttribute": origin?.dataset.attribute,
      "rolledSkill": origin?.dataset.skill,
      "rolledItem": origin?.dataset.item,
      "description": origin?.dataset.description,
      "diceResult": diceResult,
      "diceIcons": diceIcons
    };
    chatData = await temp(chatData);
    return {content: chatData};
  }

  let type = rollType;
  // console.log(type);

  if (type==="Spell") {
    chatData = {
        "canPush": false,
        "canPride": false,
        "isSpell": true,
        "roll_id": roll._id,
        "description": displayData ? displayData.description : "",
        "powerLevel": Number(diceResult.successes) + Number(displayData.powerLevel),
        "rolledSpell": displayData ? displayData.spellName : "",
        "diceResult": diceResult,
        "diceIcons": diceIcons
    };
  }

  else if (type==="Monster-attack") {
    let damage = Number(diceResult.successes) > 0 ? Number(diceResult.successes) + Number(displayData.weaponDamage) - 1 : 0;
    chatData = {
        "canPush": false,
        "canPride": false,
        "isMonsterAttack": true,
        "roll_id": roll._id,
        "rolledSkill": displayData ? displayData.skillName : "",
        "description": displayData ? displayData.description : "",
        "diceResult": mergeObject({"damage": damage }, diceResult),
        "diceIcons": diceIcons
    };
  }
  
  else if (type==="Attribute") {
    chatData = {
      "canPush": displayData ? displayData.canPush : false,
      "canPride": displayData ? displayData.canPride : false,
      "roll_id": roll._id,
      "rolledAttribute": displayData ? displayData.attributeName : "",
      "rolledSkill": displayData ? displayData.attributeName : "",
      "rolledItem": "",
      "description": "",
      "diceResult": diceResult,
      "diceIcons": diceIcons
    };
  }

  else {
    chatData = {
      "canPush": displayData ? displayData.canPush : false,
      "canPride": displayData ? displayData.canPride : false,
      "roll_id": roll._id,
      "rolledAttribute": displayData ? displayData.attributeName : "",
      "rolledSkill": displayData ? displayData.skillName : "",
      "rolledItem": displayData ? displayData.itemName : "",
      "description": displayData ? displayData.description : "",
      "diceResult": diceResult,
      "diceIcons": diceIcons
    };
  }
  
  chatData = await temp(chatData);
  return {content: chatData};
}



// ---------------- FUNCTION: prepareDiceIcons() builds the icons array passed into the Handlebars template
export function prepareDiceIcons( rollArray, artifactArray, isNegative ) {
  let attributes = rollArray[0];
  let skills = rollArray[1];
  let gear = rollArray[2];
  let artifacts = [];

  attributes = attributes.map( d => {
    return CONFIG_DICE_ATTRIBUTES[d-1];
  })
  skills = skills.map( d => {
    if (!isNegative) return CONFIG_DICE_SKILLS[d-1];
    return CONFIG_DICE_SKILLS_NEGATIVE[d-1];
  })
  gear = gear.map( d => {
    return CONFIG_DICE_GEAR[d-1];
  });

  for (let i=3; i<rollArray.length; i++) {
      let a = rollArray[i];
      // console.log(a);
      let dieType;
      if (artifactArray[i-3] === "d8") { dieType = CONFIG_DICE_ARTIFACT_MIGHTY }
      if (artifactArray[i-3] === "d10") { dieType = CONFIG_DICE_ARTIFACT_EPIC }
      if (artifactArray[i-3] === "d12") { dieType = CONFIG_DICE_ARTIFACT_LEGENDARY }
      artifacts.push(dieType[a-1]);
    };

  return {"attributes": attributes, "skills": skills, "gear": gear, "artifacts": artifacts};
}
// ----------------------------------------------------------------------------------------------------------


export async function pushingRoll(fblCustomRoll, origin) {
  const oldRoll = fblCustomRoll;
  // console.log(oldRoll);
  const newRoll = oldRoll.pushRoll();
  let message = game.messages.get(fblCustomRoll.message_id);
  let displayData = {"canPush": true, "canPride": true};
  let chatData = await prepareChatData(newRoll, undefined, displayData, true, origin);
  message.update(chatData);
  // console.log(fblCustomRoll.sequence);
  ui.chat.updateMessage(message, true);
}

export async function prideRoll(fblCustomRoll, origin) {
  const oldRoll = fblCustomRoll;
  // console.log(oldRoll);
  const newRoll = oldRoll.rollPride();
  let message = game.messages.get(fblCustomRoll.message_id);
  let displayData = {"canPush": false,"canPride": false};
  const data = await prepareChatData(newRoll, undefined, displayData, true, origin);
  message.update(data);
  // console.log(fblCustomRoll.sequence);
  ui.chat.updateMessage(message, true);
}
// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

