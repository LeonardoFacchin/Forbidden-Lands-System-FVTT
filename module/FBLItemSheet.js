// Import some relevant constants referenced by item sheets,
// like magic and weapon ranges, magical disciplines, spell durations, etc.
// see config.js for the definitions

import {  CONFIG_PC_CLASSES,
          CONFIG_WEAPON_DAMAGE,
          CONFIG_WEAPON_FEATURES,
          CONFIG_DAMAGE_TYPE,
          CONFIG_ARTIFACT_DIE,
          CONFIG_COMBAT_RANGES,
          CONFIG_TALENT_TYPE,
          CONFIG_MAGIC_DISCIPLINES,
          CONFIG_MAGIC_RANGES,
          CONFIG_MAGIC_DURATIONS,
          CONFIG_EQUIP_SUPPLY,
          CONFIG_EQUIP_WEIGHT,
          CONFIG_MONEY,
          CONFIG_SKILLS_LIST,
          CONFIG_WEAPON_SKILLS,
          CONFIG_ARMOR_LOCATION,
          CONFIG_LETHAL,
          CONFIG_TIME_LIMIT,
          CONFIG_HEALING_TIME } from "./Config.js";

/* ----------------------- FBLItemSheet ------------------------*/
// extension of the ItemSheet class. NOT INSTANTIATED DIRECTLY, only for inheritance.
/*--------------------------------------------------------------------*/

export class FBLItemSheet extends ItemSheet {

  constructor(object, options) {
    super(object, options);
    this.isBeingEdited = false;
  }

  getData() {
    let data = super.getData();
    // retrieve the editing flag so that it
    // can be passed to the Handlebar templates as context
    // this.settings is defined in each FBLItemSheet child implementation
    data = mergeObject(duplicate(data), {"isBeingEdited": this.isBeingEdited, "settings": this.settings});
    return data;
  }

  // add listeners to allow for the editing of the sheet
  activateListeners(html) {
    super.activateListeners(html)
    // add event listeners to the edit and save html icon elements
    // and bind the sheet instance to "this" so that the sheet object can 
    // easily be referenced in the eventhandler function
    this.form.querySelectorAll(".fas.fa-edit, .fas.fa-save").forEach( (el) => el.addEventListener("click", editSheet.bind(this)));

    // sheet editing event handler
    async function editSheet (event) {
      event.preventDefault();
      // if the user just clicked on the "save" icon change the flag to signal that the 
      // user is done editing and then re-render the sheet
      if (this.isBeingEdited) {
        await this.submit();
        this.isBeingEdited = false;
        this.render(true);
      }
      // if the user clicked on the "edit" icon, change the flag to signal that the user is
      // now editing the content and re-render the sheet
      else {  this.isBeingEdited = true;
              this.render(true);
      }
    }
  }
}

/* ----------------------- MonsterAttackSheet ------------------------*/
//
/*--------------------------------------------------------------------*/

export class MonsterAttackSheet extends FBLItemSheet {
    constructor(object, options) {
    super(object, options);
    this.settings =  {"damage-types": CONFIG_DAMAGE_TYPE, "ranges": CONFIG_COMBAT_RANGES};
    }

    /** @override */
      static get defaultOptions() {
  
        return mergeObject(super.defaultOptions, {
          classes: ["fbl"],
          template: "systems/forbiddenlands/templates/monster-attack-sheet.html",
          width: 500,
          // height: 400,
          resizable: false
      });
    }
  }

/* ----------------------- MonsterSpecialAbilitySheet ------------------------*/
//
/*--------------------------------------------------------------------*/

export class MonsterSpecialAbilitySheet extends FBLItemSheet {

    /** @override */
      static get defaultOptions() {
  
        return mergeObject(super.defaultOptions, {
          classes: ["fbl"],
          template: "systems/forbiddenlands/templates/monster-special-ability-sheet.html",
          width: 460,
          // height: 350,
          resizable: false
      });
    }
}  


/* ----------------------- CharacterTalentSheet ------------------------*/
//
/*--------------------------------------------------------------------*/

export class CharacterTalentSheet extends FBLItemSheet {
  constructor(object, options) {
    super(object, options);
    this.settings =  {"professions": CONFIG_PC_CLASSES, "talent-type": CONFIG_TALENT_TYPE, "disciplines": CONFIG_MAGIC_DISCIPLINES};
    // this.isBeingEdited = false;
  }

    /** @override */
      static get defaultOptions() {
  
        return mergeObject(super.defaultOptions, {
            classes: ["fbl"],
            template: "systems/forbiddenlands/templates/character-talent-sheet.html",
            width: 520,
            // height: 475
            resizable: false
      });
    }

}  

/* ----------------------- SpellSheet ------------------------*/
//
/*--------------------------------------------------------------------*/

export class SpellSheet extends FBLItemSheet {
  // extend the constructor to include configuration definitions for general settings and the sheet editing flag
  constructor(object, options) {
    super(object, options);
    this.settings =  {"disciplines": CONFIG_MAGIC_DISCIPLINES, "ranges": CONFIG_MAGIC_RANGES, "durations": CONFIG_MAGIC_DURATIONS};
    // this.isBeingEdited = false;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["fbl"],
      template: "systems/forbiddenlands/templates/spell-sheet.html",
      //width: 500,
      // height: 400,
      resizable: false
    });    
  }
}

/* ----------------------- EquipmentSheet ------------------------*/
//
/*--------------------------------------------------------------------*/

export class EquipmentSheet extends FBLItemSheet {
  constructor(object, options) {
    super(object, options);
    this.settings =  {"skills": CONFIG_SKILLS_LIST, "supply": CONFIG_EQUIP_SUPPLY, "weight": CONFIG_EQUIP_WEIGHT, "money": CONFIG_MONEY};
  }


  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["fbl"],
      template: "systems/forbiddenlands/templates/equipment-sheet.html",
      //width: 725,
      // height: 400,
      resizable: false
    });    
  }
}

/* ----------------------- WeaponSheet ------------------------*/
//
/*--------------------------------------------------------------------*/

export class WeaponSheet extends FBLItemSheet {
  constructor(object, options) {
    super(object, options);
    this.settings =  {"skills": CONFIG_WEAPON_SKILLS,
                      "damagetype": CONFIG_WEAPON_DAMAGE,
                      "artifactDie": CONFIG_ARTIFACT_DIE,
                      "ranges": CONFIG_COMBAT_RANGES,
                      "features": CONFIG_WEAPON_FEATURES,
                      "supply": CONFIG_EQUIP_SUPPLY,
                      "weight": CONFIG_EQUIP_WEIGHT,
                      "money": CONFIG_MONEY};
  }


  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["fbl"],
      template: "systems/forbiddenlands/templates/weapon-sheet.html",
      //width: 725,
      // height: 400,
      resizable: false
    });    
  }
}

  /* ----------------------- ArmorSheet ------------------------*/
//
/*--------------------------------------------------------------------*/

export class ArmorSheet extends FBLItemSheet {
  constructor(object, options) {
    super(object, options);
    this.settings =  {"locations": CONFIG_ARMOR_LOCATION,
                      "artifact-die": CONFIG_ARTIFACT_DIE,
                      "supply": CONFIG_EQUIP_SUPPLY,
                      "weight": CONFIG_EQUIP_WEIGHT,
                      "money": CONFIG_MONEY};
  }


  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["fbl"],
      template: "systems/forbiddenlands/templates/armor-sheet.html",
      //width: 725,
      // height: 400,
      resizable: false
    });    
  }
}

  /* ----------------------- CriticalInjurySheet ------------------------*/
//
/*--------------------------------------------------------------------*/

export class CriticalInjurySheet extends FBLItemSheet {
  
  constructor(object, options) {    
    super(object, options);
    this.isBeingEdited = true;
    this.settings =  { "type": CONFIG_DAMAGE_TYPE,
                       "lethal": CONFIG_LETHAL,
                       "healingTime": CONFIG_HEALING_TIME,
                       "timeLimit": CONFIG_TIME_LIMIT,
                       "skills": CONFIG_SKILLS_LIST };
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["fbl"],
      template: "systems/forbiddenlands/templates/critical-injury-sheet.html",
      //width: 725,
      // height: 400,
      resizable: false
    });    
  }

  activateListeners(html) {
    super.activateListeners(html);
    document.querySelector(".criticalInjury").addEventListener("click", _managePenalties.bind(this) );

    async function _managePenalties(event) {
      event.preventDefault();
      const target = event.target;
      const id = target.id;
      if (!id) return;
      let data = this.getData();
      if (target.classList.contains("fa-plus")) {
        console.log("fa-plus fired");
        let nextPenalty = `penalty_0${Object.keys(data.data.bonus).length}`;
        const newData = {"data.bonus": {[nextPenalty]: {"skill": "", "value": 0} }};
        return this.object.update(newData);
      }
      if (target.classList.contains("fa-minus")) {
        let newEntries = duplicate(data.data.bonus);
        //trick to delete a property
        newEntries["-=" + id] = null;
        return this.object.update({ "data.bonus": newEntries});
      }
    }
  }
}