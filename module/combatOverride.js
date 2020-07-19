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