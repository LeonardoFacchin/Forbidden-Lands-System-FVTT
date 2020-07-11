// Configuration file for constants used throughout the System
// Gathered here for ease of maintenance

// CHARACTER STATS

export const CONFIG_SKILLS_LIST = {
  "noskill" : {name: "None", attr: ""},
  "skill_01": {name: "Might", attr: "Str"},
  "skill_02": {name: "Endurance", attr: "Str"},
  "skill_03": {name: "Melee", attr: "Str"},
  "skill_04": {name: "Crafting", attr: "Str"},
  "skill_05": {name: "Stealth", attr: "Agi"},
  "skill_06": {name: "Sleight of Hand", attr: "Agi"},
  "skill_07": {name: "Move", attr: "Agi"},
  "skill_08": {name: "Marksmanship", attr: "Agi"},
  "skill_09": {name: "Scouting", attr: "Wit"},
  "skill_10": {name: "Lore", attr: "Wit"},
  "skill_11": {name: "Survival", attr: "Wit"},
  "skill_12": {name: "Insight", attr: "Wit"},
  "skill_13": {name: "Manipulation", attr: "Emp"},
  "skill_14": {name: "Performance", attr: "Emp"},
  "skill_15": {name: "Healing", attr: "Emp"},
  "skill_16": {name: "Animal Handling", attr: "Emp"}
};

export const CONFIG_EXPERIENCE_ICONS = ["systems/forbiddenlands/icons/sheets/xp-marked.svg", "systems/forbiddenlands/icons/sheets/xp-unmarked.svg"];

export const CONFIG_WILLPOWER_ICONS = ["systems/forbiddenlands/icons/sheets/willpower-marked.svg", "systems/forbiddenlands/icons/sheets/willpower-unmarked.svg"];

export const CONFIG_PC_CLASSES = ["Druid", "Fighter", "Hunter", "Minstrel", "Peddler", "Rider", "Rogue", "Sorcerer"];

export const CONFIG_TALENT_TYPE = ["Kin", "Professional", "General"];

export const CONFIG_WEAPON_SKILLS = ["Melee","Marksmanship"];

// EQUIPMENT/INVENTORY

export const CONFIG_ARTIFACT_DIE = [" - ", "d8", "d10", "d12"];

export const CONFIG_DICE_ICONS = {
  "dX": "systems/forbiddenlands/icons/dice/dXblack.svg",
  "d6": "systems/forbiddenlands/icons/dice/d6black.svg",
  "d8": "systems/forbiddenlands/icons/dice/d8black.svg",
  "d10": "systems/forbiddenlands/icons/dice/d10black.svg",
  "d12": "systems/forbiddenlands/icons/dice/d12black.svg"};

export const CONFIG_WEAPON_DAMAGE = ["Blunt", "Slash", "Stab"]

export const CONFIG_WEAPON_FEATURES = ["", "Blunt", "Edged", "Light", "Heavy", "Hook", "Parrying", "Pointed", "Slow"]

export const CONFIG_ARMOR_LOCATION = ["Body", "Head"]

export const CONFIG_EQUIP_SUPPLY = ["Common", "Uncommon", "Rare"];

export const CONFIG_EQUIP_WEIGHT = [" - ", "Tiny", "Light", "Normal", "Heavy"];

export const CONFIG_DAMAGE_TYPE = [CONFIG_WEAPON_DAMAGE[0], CONFIG_WEAPON_DAMAGE[1], CONFIG_WEAPON_DAMAGE[2], "Other", "Horror"];

export const CONFIG_MONEY = ["Copper", "Silver", "Gold"];

export const CONFIG_WEAR_ICONS = ["systems/forbiddenlands/icons/sheets/equip-wear.svg", "systems/forbiddenlands/icons/sheets/equip-healthy.svg"];

export const CONFIG_CONSUMABLE_ICONS = {
  "Food": "systems/forbiddenlands/icons/sheets/consumables/sliced-bread.svg",
  "Water": "systems/forbiddenlands/icons/sheets/consumables/magic-potion.svg",
  "Arrows": "systems/forbiddenlands/icons/sheets/consumables/arrow-cluster.svg",
  "Torches": "systems/forbiddenlands/icons/sheets/consumables/torch.svg",
}

// MAGIC

export const CONFIG_MAGIC_DISCIPLINES = {
    "general": {name: "General", url:"systems/forbiddenlands/icons/magic-disciplines/magic-swirl.svg"},
    "healing": {name: "Healing Magic", url: "systems/forbiddenlands/icons/magic-disciplines/caduceus.svg"},
    "shapeshifting": {name: "Shapeshifting", url: "systems/forbiddenlands/icons/magic-disciplines/wolf-howl.svg"},
    "awarness": {name: "Awarness", url: "systems/forbiddenlands/icons/magic-disciplines/beast-eye.svg"},
    "symbolism": {name: "Symbolism", url: "systems/forbiddenlands/icons/magic-disciplines/cursed-star.svg"},
    "stonesong": {name: "Stone Song", url: "systems/forbiddenlands/icons/magic-disciplines/mountaintop.svg"},
    "blood": {name: "Blood Magic", url: "systems/forbiddenlands/icons/magic-disciplines/drop.svg"},
    "death": {name: "Death Magic", url: "systems/forbiddenlands/icons/magic-disciplines/grim-reaper.svg"},
    "elemental": {name: "Elemental Magic", url: "systems/forbiddenlands/icons/magic-disciplines/wildfires.svg"},
    "ice": {name: "Ice Affinity", url: "systems/forbiddenlands/icons/magic-disciplines/frozen-orb.svg"}
  };
  
  export const CONFIG_COMBAT_RANGES = ["Arm's Length", "Near","Short", "Long", "Distant"];

  export const CONFIG_MAGIC_RANGES = ["Personal", CONFIG_COMBAT_RANGES[0], CONFIG_COMBAT_RANGES[1], CONFIG_COMBAT_RANGES[2], CONFIG_COMBAT_RANGES[3], CONFIG_COMBAT_RANGES[4], "Varies", "Unlimited"];
  
  export const CONFIG_MAGIC_DURATIONS = ["Immediate", "One Round", "One Round per Power Level", "One Turn (15 minutes)", "Quarter Day", "Quarter Day per Power Level", "Varies"];


  // INJURIES AND CONDITIONS

  export const CONFIG_WOUND_ICONS = ["systems/forbiddenlands/icons/sheets/attribute-damaged.svg", "systems/forbiddenlands/icons/sheets/attribute-healthy.svg"];

  export const CONFIG_CONDITIONS_ICONS = {
    "hungry": ["systems/forbiddenlands/icons/sheets/conditions/eating-marked.svg","systems/forbiddenlands/icons/sheets/conditions/eating-unmarked.svg"],
    "thirsty": ["systems/forbiddenlands/icons/sheets/conditions/drinking-marked.svg", "systems/forbiddenlands/icons/sheets/conditions/drinking-unmarked.svg"],
    "sleepy": ["systems/forbiddenlands/icons/sheets/conditions/sleepy-marked.svg", "systems/forbiddenlands/icons/sheets/conditions/sleepy-unmarked.svg"],
    "cold": ["systems/forbiddenlands/icons/sheets/conditions/snowflake-2-marked.svg","systems/forbiddenlands/icons/sheets/conditions/snowflake-2-unmarked.svg"]
  }

  export const CONFIG_INJURY_STATUS = {    
    "lethal": ["systems/forbiddenlands/icons/sheets/injuries/skull-crossed-bones.svg"],
    "open": ["systems/forbiddenlands/icons/sheets/injuries/open-wound.svg"],
    "healing": ["systems/forbiddenlands/icons/sheets/injuries/health-normal.svg"],
  }

  export const CONFIG_LETHAL = ["No", "Yes"];

  export const CONFIG_TIME_LIMIT = [" - ", "Rounds", "Minutes", "Hours", "Days"];

  export const CONFIG_HEALING_TIME = [" - ", "d6", "2d6", "3d6", "Permanent"];

  // DICE

  export const CONFIG_DICE_MODIFIERS = [
    ["systems/forbiddenlands/icons/dice/d0_unmarked.svg", "systems/forbiddenlands/icons/dice/d1_unmarked.svg", "systems/forbiddenlands/icons/dice/d2_unmarked.svg", "systems/forbiddenlands/icons/dice/d3_unmarked.svg", "systems/forbiddenlands/icons/dice/d4_unmarked.svg","systems/forbiddenlands/icons/dice/d5_unmarked.svg"],
    ["systems/forbiddenlands/icons/dice/d0_marked.svg", "systems/forbiddenlands/icons/dice/d1_marked.svg", "systems/forbiddenlands/icons/dice/d2_marked.svg", "systems/forbiddenlands/icons/dice/d3_marked.svg", "systems/forbiddenlands/icons/dice/d4_marked.svg","systems/forbiddenlands/icons/dice/d5_marked.svg"]
  ]

  export const CONFIG_ARTIFACT_MODIFIERS = {    
    "modifierOne": ["systems/forbiddenlands/icons/dice/d8black.svg","systems/forbiddenlands/icons/dice/d8grey.svg"],
    "modifierTwo": ["systems/forbiddenlands/icons/dice/d8black.svg", "systems/forbiddenlands/icons/dice/d8grey.svg"],
    "modifierThree": ["systems/forbiddenlands/icons/dice/d8black.svg", "systems/forbiddenlands/icons/dice/d8grey.svg"],
  }

  export const CONFIG_DICE_ATTRIBUTES = [
    "systems/forbiddenlands/icons/dice/custom/base-d6-1.svg",
    "systems/forbiddenlands/icons/dice/custom/base-d6-2.svg",
    "systems/forbiddenlands/icons/dice/custom/base-d6-3.svg",
    "systems/forbiddenlands/icons/dice/custom/base-d6-4.svg",
    "systems/forbiddenlands/icons/dice/custom/base-d6-5.svg",
    "systems/forbiddenlands/icons/dice/custom/base-d6-6.svg"
  ]

  export const CONFIG_DICE_SKILLS = [
    "systems/forbiddenlands/icons/dice/custom/skill-d6-1.svg",
    "systems/forbiddenlands/icons/dice/custom/skill-d6-2.svg",
    "systems/forbiddenlands/icons/dice/custom/skill-d6-3.svg",
    "systems/forbiddenlands/icons/dice/custom/skill-d6-4.svg",
    "systems/forbiddenlands/icons/dice/custom/skill-d6-5.svg",
    "systems/forbiddenlands/icons/dice/custom/skill-d6-6.svg"
  ]

  export const CONFIG_DICE_SKILLS_NEGATIVE = [
    "systems/forbiddenlands/icons/dice/custom/skill-negative-d6-1.svg",
    "systems/forbiddenlands/icons/dice/custom/skill-negative-d6-2.svg",
    "systems/forbiddenlands/icons/dice/custom/skill-negative-d6-3.svg",
    "systems/forbiddenlands/icons/dice/custom/skill-negative-d6-4.svg",
    "systems/forbiddenlands/icons/dice/custom/skill-negative-d6-5.svg",
    "systems/forbiddenlands/icons/dice/custom/skill-negative-d6-6.svg"
  ]

  export const CONFIG_DICE_GEAR = [
    "systems/forbiddenlands/icons/dice/custom/gear-d6-1.svg",
    "systems/forbiddenlands/icons/dice/custom/gear-d6-2.svg",
    "systems/forbiddenlands/icons/dice/custom/gear-d6-3.svg",
    "systems/forbiddenlands/icons/dice/custom/gear-d6-4.svg",
    "systems/forbiddenlands/icons/dice/custom/gear-d6-5.svg",
    "systems/forbiddenlands/icons/dice/custom/gear-d6-6.svg"
  ]

  export const CONFIG_DICE_ARTIFACT_MIGHTY = [
    "systems/forbiddenlands/icons/dice/custom/artifact-d8-1.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d8-2.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d8-3.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d8-4.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d8-5.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d8-6.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d8-7.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d8-8.svg"
  ]

  export const CONFIG_DICE_ARTIFACT_EPIC = [
    "systems/forbiddenlands/icons/dice/custom/artifact-d10-1.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d10-2.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d10-3.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d10-4.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d10-5.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d10-6.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d10-7.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d10-8.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d10-9.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d10-10.svg"
    ]

  export const CONFIG_DICE_ARTIFACT_LEGENDARY = [
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-1.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-2.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-3.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-4.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-5.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-6.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-7.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-8.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-9.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-10.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-11.svg",
    "systems/forbiddenlands/icons/dice/custom/artifact-d12-12.svg"
  ]
