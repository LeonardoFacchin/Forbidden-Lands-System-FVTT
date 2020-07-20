import {CONFIG_COMBAT_TRACKER_ACTIONS } from "./config.js"

// ------------------------------------------------------------------------------------------------
// ---------------------- spellDialog: Forbidden Lands Combat Tracker extension ---------------------
// ------------------------------------------------------------------------------------------------

export class FBLCombatTracker extends CombatTracker {

  static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
      id: "combat",
      template: "/systems/forbiddenlands/templates/combat-tracker.html",
      title: "Combat Tracker",
      scrollY: [".directory-list"],
      width: 325
    });

  }

  async getData(options) {
    // Get the combat encounters possible for the viewed Scene
    const combat = this.combat;
    const hasCombat = combat !== null;
    const view = canvas.scene;
    const combats = view ? game.combats.entities.filter(c => c.data.scene === view._id) : [];
    const currentIdx = combats.findIndex(c => c === this.combat);
    const previousId = currentIdx > 0 ? combats[currentIdx-1].id : null;
    const nextId = currentIdx < combats.length - 1 ? combats[currentIdx+1].id : null;
    const settings = game.settings.get("core", Combat.CONFIG_SETTING);
    // Prepare rendering data

    const data = {
      user: game.user,
      combats: combats,
      currentIndex: currentIdx + 1,
      combatCount: combats.length,
      hasCombat: hasCombat,
      combat,
      turns: [],
      previousId,
      nextId,
      started: this.started,
      control: false,
      settings
    };

    if ( !hasCombat ) return data;
    // Add active combat data
    const combatant = combat.combatant;
    const hasControl = combatant && combatant.players && combatant.players.includes(game.user);
    // Update data for combatant turns
    const decimals = CONFIG.Combat.initiative.decimals;
    const turns = [];
    for ( let [i, t] of combat.turns.entries() ) {
      if ( !t.visible ) continue;
      // Name and Image
      t.name = t.token.name || t.actor.name;
      if ( t.defeated ) t.img = CONFIG.controlIcons.defeated;
      else if ( VideoHelper.hasVideoExtension(t.token.img) ) {
        t.img = await game.video.createThumbnail(t.token.img, {width: 100, height: 100});
      }
      else t.img = t.token.img || t.actor.img;
      // Turn order and initiative
      t.active = i === combat.turn;
      t.initiative = isNaN(parseFloat(t.initiative)) ? null : Number(t.initiative).toFixed(decimals);
      t.hasRolled = t.initiative !== null;
      t.actTwice = t.flags?.forbiddenlands?.actTwice ? t.flags.forbiddenlands.actTwice : false;
      t.surprise = t.flags?.forbiddenlands?.hasSurprise ? t.flags.forbiddenlands.hasSurprise : false;
      // Styling rules
      t.css = [
        t.active ? "active" : "",
        t.hidden ? "hidden" : "",
        t.defeated ? "defeated" : ""
      ].join(" ").trim();
      // Tracked resources
      t.fAction = t.flags?.forbiddenlands?.fastActionSpent ? CONFIG_COMBAT_TRACKER_ACTIONS.fast[1] : CONFIG_COMBAT_TRACKER_ACTIONS.fast[0];
      // console.log(t.fAction);
      t.sAction = t.flags?.forbiddenlands?.slowActionSpent ? CONFIG_COMBAT_TRACKER_ACTIONS.slow[1] : CONFIG_COMBAT_TRACKER_ACTIONS.slow[0];
      // console.log(t.sAction);
      t.resource = t.actor.data.data.attributes.Strength.value - this.trackedResources[t.tokenId][settings.resource];
      turns.push(t);
    }

    // Merge update data for rendering
    return mergeObject(data, {
      round: combat.data.round,
      turn: combat.data.turn,
      turns: turns,
      control: hasControl
    });
  }


  async _onCombatantControl(event) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const li = btn.closest(".combatant");
    const c = this.combat.getCombatant(li.dataset.combatantId);
    // Switch control action
    switch (btn.dataset.control) {
      // Toggle combatant visibility
      case "toggleHidden":
        await this.combat.updateCombatant({_id: c._id, hidden: !c.hidden});
        break;

      // Toggle combatant defeated flag
      case "toggleDefeated":
        let isDefeated = !c.defeated;
        await this.combat.updateCombatant({_id: c._id, defeated: isDefeated});
        const token = canvas.tokens.get(c.tokenId);
        if ( token ) {
          if ( isDefeated && !token.data.overlayEffect ) token.toggleOverlay(CONFIG.controlIcons.defeated);
          else if ( !isDefeated && token.data.overlayEffect === CONFIG.controlIcons.defeated ) token.toggleOverlay(null);
        }
        break;
      
      case "toggleActTwice":
        const isActingTwice = c.flags?.forbiddenlands?.actTwice ? !c.flags.forbiddenlands.actTwice : true;
        await this.combat.updateCombatant({_id: c._id, "flags.forbiddenlands.actTwice": isActingTwice });
        console.log(c);
        break;

      case "toggleSurprise":
        const isSurprise = c.flags?.forbiddenlands?.hasSurprise ? !c.flags.forbiddenlands.hasSurprise : true;
        await this.combat.updateCombatant({_id: c._id, "flags.forbiddenlands.hasSurprise": isSurprise });
        break;

      case "toggleFastAction":
        const isFastActionSpent = c.flags?.forbiddenlands?.fastActionSpent ? !c.flags.forbiddenlands.fastActionSpent : true;
        await this.combat.updateCombatant({_id: c._id, "flags.forbiddenlands.fastActionSpent": isFastActionSpent });
        break;

      case "toggleSlowAction":
        const isSlowActionSpent = c.flags?.forbiddenlands?.slowActionSpent ? !c.flags.forbiddenlands.slowActionSpent : true;
        await this.combat.updateCombatant({_id: c._id, "flags.forbiddenlands.slowActionSpent": isSlowActionSpent });
        break;    
    }

    // Render tracker updates
    this.render();
  }
}

// ------------------------------------------------------------------------------------------------
// ----------------------------- Combat Class methods override ------------------------------------
// ------------------------------------------------------------------------------------------------

export const setupTurns = function () {

    console.log("setupTurns fired");
    const scene = game.scenes.get(this.data.scene);
    const players = game.users.players;
    // Populate additional data for each combatant
    // console.log(this.data);
    let turns = this.data.combatants.map(c => {
      c.token = scene.getEmbeddedEntity("Token", c.tokenId);
      if ( !c.token ) return c;
      c.actor = Actor.fromToken(new Token(c.token, scene));
      c.players = c.actor ? players.filter(u => c.actor.hasPerm(u, "OWNER")) : [];
      c.owner = game.user.isGM || (c.actor ? c.actor.owner : false);
      c.visible = c.owner || !c.hidden;
      return c;
    }).filter(c => c.token);
    // console.log(turns);

    // Sort turns into initiative order: (1) initiative, (2) name, (3) tokenId
    turns = turns.sort((a, b) => {
      const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
      const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
      let ci = ia - ib;
      if ( ci !== 0 ) return ci;
      let [an, bn] = [a.token.name || "", b.token.name || ""];
      let cn = an.localeCompare(bn);
      if ( cn !== 0 ) return cn;
      return a.tokenId - b.tokenId;
    });

    // Ensure the current turn is bounded
    this.data.turn = Math.clamped(this.data.turn, 0, turns.length-1);
    this.turns = turns;
    // When turns change, tracked resources also change
    if ( ui.combat ) ui.combat.updateTrackedResources();
    // console.log(turns);
    return this.turns;
}
// -----------------------------------------------------------------------------------------------------------

export const rollAll = async function () {
  
  let combatants = this.data.combatants;

  // reset the hasInitiative flag before rolling and
  // duplicate the entries of combatants that can take two actions per round
  let combatantsData = this.data.combatants.filter( c => c.flags?.forbiddenlands?.actTwice).map( c => c );

  await this.createEmbeddedEntity("Combatant", combatantsData);

  let prepareCombatants = this.data.combatants.map( c => {
    let data;
    data = (c.flags?.forbiddenlands?.actTwice) ? {"flags.forbiddenlands.actTwice": false, "flags.forbiddenlands.doubleAction": true} : {};
    data = mergeObject({_id: c._id, "flags.forbiddenlands.hasInitiative": false}, data);
    return data;
  });

  await this.updateEmbeddedEntity("Combatant", prepareCombatants);

  // console.log(this.data.combatants);

    let combatantsArray;
    let isOverflowing = false;


    if (combatants.length <= 10) { 
      combatantsArray = Array.from(combatants).sort( (a, b) => { 
        const aTalent = a.actor.data.data.Talent?.find( t => t.name === "Lightning Fast");
        const aRank = aTalent?.data.talentRank || 0;
        const bTalent = b.actor.data.data.Talent?.find( t => t.name === "Lightning Fast");
        const bRank = bTalent?.data.talentRank || 0;
        return bRank - aRank;
      })
      // console.log(combatantsArray);
    }

    else {
      // Build the array of combatants with the Lightning Fast Talent
      let LFArray = [];
      let othersArray = Array.from(combatants);
      combatants.forEach( c => {
        if (c.actor.data.data.Talent?.some( t => t.name == "Lightning Fast")) LFArray.push(c);
      });
      // Sort the Lighning Fast combatants in descending order of talent rank
      LFArray.sort((a, b) => { 
        const aTalent = a.actor.data.data.Talent.find( t => t.name === "Lightning Fast");
        const aRank = aTalent.data.talentRank;
        const bTalent = b.actor.data.data.Talent.find( t => t.name === "Lightning Fast");
        const bRank = bTalent.data.talentRank;
        return bRank - aRank;
      });
      // console.log("LFArray: ", LFArray);
      // Remove the combatants with Lightning Fast from the other array
      LFArray.forEach( e => {
        const index = combatants.indexOf(e);
        othersArray.splice(index, 1);
      });
      console.log("othersArray (before removing doubles): ", othersArray);        
      // Reduce the NPCs combatants to a single sample per archetype
      let doublesArray = Array.from(othersArray);
      // console.log("doublesArray: ", doublesArray);
      doublesArray = doublesArray.reduce( ( o, e ) => {
        return o = e.flags?.forbiddenlands?.doubleAction ? o.concat([e]) : o;
      }, []);
      // console.log("doublesArray (reduced): ", doublesArray);
      // Remove the twice acting combatants from the other array
      doublesArray.forEach( e => {
        const index = othersArray.indexOf(e);
        othersArray.splice(index, 1);
      });
      // console.log("othersArray (after removing doubles): ", othersArray); 
      // Reduce the remaining array to a single representative for each enemy archetype
      othersArray = othersArray.reduce( ( o, e ) => {
        return o = !o.some( i => i?.actor.name === e.actor.name) ? o.concat([e]) : o;
      }, []);
      // console.log("othersArray (final): ", othersArray);
      combatantsArray = LFArray.concat(doublesArray.concat(othersArray));
      // console.log("combatantsArray: ", combatantsArray);
      if (combatantsArray.length > 10) ui.notifications.error("Too many combatants. Please split the encounter into sub-encounters so that no more than 10 PCs + NPCs archetypes are present.");
      isOverflowing =  true;
      // console.log(combatantsArray);      
    }

    let cardsArray = [1,2,3,4,5,6,7,8,9,10]; 

    for ( let c of combatantsArray ) cardsArray = await rollInitiative.bind(this)(c, cardsArray, isOverflowing);

    // console.log(this);
}

// -----------------------------------------------------------------------------------------------------------

export const rollInitiative = async function (combatant, cardsArray, isOverflowing = false) {

  const talent = combatant.actor.data.data.Talent?.find( t => t.name === "Lightning Fast");
  const rank = Number(talent?.data.talentRank) || 0;
  const surprise = combatant.flags?.forbiddenlands.hasSurprise ? 1 : 0;
  // console.log(surprise); 
  const nCard = 1 + rank + surprise;
  // draw a number of cards equal to 1 + Lightning Fast rank
  let draw = [];
  for (let i = 0; i < nCard; i++) {
    let dieFaces = cardsArray.length - i;
    if (dieFaces <= 0) break;
    let die = new Die(dieFaces);
    let res = die.roll().results[0];
    draw = draw.concat(cardsArray.splice(res - 1, 1));
  }
  // console.log(draw)
;  // set the initiative value to the lower card value
  const init = draw.reduce( (m, i) => {
    return Math.min(i, m);
  }, 10);
  // console.log(init);

  let combatants = (isOverflowing && !combatant.flags?.forbiddenlands?.doubleAction) ? this.data.combatants.filter( c => { return (c.actor.name === combatant.actor.name && 
    !c.flags?.forbiddenlands?.hasInitiative)}) : [combatant];
  // console.log(combatant.actor.name, combatants);
  let updates = combatants.map( c => {return {_id: c._id, initiative: init, "flags.forbiddenlands.hasInitiative": true}});
  await this.updateEmbeddedEntity("Combatant", updates);

  // prepare the cards array for the next draw
  let ind = draw.indexOf(init);
  // console.log(ind);
  draw.splice(ind, 1);
  // console.log(draw);
  cardsArray = cardsArray.concat(draw).sort( (a,b) => {return a-b});
  // console.log(cardsArray);
  return cardsArray;
}
// -----------------------------------------------------------------------------------------------------------

export const nextRound = async function() {
  let turn = 0;
  if ( this.settings.skipDefeated ) {
    turn = this.turns.findIndex(t => !t.defeated);
    if (turn === -1) {
      ui.notifications.warn(game.i18n.localize("COMBAT.NoneRemaining"));
      turn = 0;
    }
  }
  let updates = this.combatants.map( c => {
    return {_id: c._id, "flags.forbiddenlands.fastActionSpent": false, "flags.forbiddenlands.slowActionSpent": false}
  })
  await this.updateEmbeddedEntity("Combatant", updates);
  return this.update({round: this.round+1, turn: turn});
}
// -----------------------------------------------------------------------------------------------------------

export const nextTurn = async function() {
    let turn = this.turn;
    let skip = this.settings.skipDefeated;
    // Determine the next turn number
    let next = null;
    if ( skip ) {
      for ( let [i, t] of this.turns.entries() ) {
        if ( i <= turn ) continue;
        if ( !t.defeated ) {
          next = i;
          break;
        }
      }
    } else next = turn + 1;

    // Maybe advance to the next round
    let round = this.round;
    if ( (this.round === 0) || (next === null) || (next >= this.turns.length) ) {
      round = round + 1;
      // reset combatants' available actions
      let updates = this.combatants.map( c => {
        return {_id: c._id, "flags.forbiddenlands.fastActionSpent": false, "flags.forbiddenlands.slowActionSpent": false}
      })
      await this.updateEmbeddedEntity("Combatant", updates);

      next = 0;
      if ( skip ) {
        next = this.turns.findIndex(t => !t.defeated);
        if (next === -1) {
          ui.notifications.warn(game.i18n.localize("COMBAT.NoneRemaining"));
          next = 0;
        }
      }
    }

    // Update the encounter
    return this.update({round: round, turn: next});
  }