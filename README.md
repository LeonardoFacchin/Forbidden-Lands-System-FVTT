## Foundry VTT - Forbidden Lands System

**version**: 0.1.0  
**supported browsers**: Chrome, Edge  
(NB: Firefox won't display character sheets as intended. Right now I'm incliend not to bother trying to make the system work with Firefox, mostly because on my PC Firefox performance was way worse than Edge's or Chrome's. If enough people are **really really** interested I might change my mind, but I suggest using Chrome to be on the safe side)

# Features not yet supported
- No Stronghold sheet, nor functions
- No custom initiative tracker (that is: right now my system doesn't provide a way to set the initiatve score according to card draws according to FBL rules, nor to track the expenditure of slow and fast actions. These features require to modify the combat tracker, something I have not yet looked into)
- No Hidden Combinations advanced combat
- No way to track Poisoned or Diseased state on the character sheet (use tokens state as a stopgap, please)

# Supported features and mechanics
- Sheets for the three actor types: PCs, NPCs and Monsters
- Sheets for:
    - Monster Attacks, Monster Special Abilities
    - Talents, Spells, Critical Injuries
    - Weapons, Armor, Equipment

The system supports dragging and dropping items onto the actor sheet.
The advantage is that once the required items have been created, very little typing will be required while running sessions. If a character needs a sword, the user will just have to drag the sword from the World Items or Compendium panels and the sword will be added to that character's inventory. Same goes for Equipment, Talents, Injuries, etc.  
The downside is the frontloading of the import process: all the items required to run a session will have to be imported from the rulebook in advance or created on the spot by a user with permission. I can't include the items in the system as Compendium packs because of copyright.

# Automation 
Most dice checks a user will be required to roll during the game are automated to some extent.
As a general rule, if an element on the actor sheet gets highlighted in orange when hovering, then that element can be interacted with according to the following guidelines:
- Double clicking an attribute, skill, weapon or equipment name will roll the corresponding check, automatically retrieving all the required informations. For example, if double clicking a weapon's name will cause an attack check to be rolled by adding together the character's relevant current attribute value, skill and the current gear bonus of the weapon, including artifact dice modifiers.
Injuries and Talents effects are **NOT** automatically included in the computation. Character's and NPC's sheets have a modifier track that allows you to add a modifier to the roll (range: -6 to + 6) and up to 3 d8 artifact dice (to account for Talents, for example).
All these rolls support Pushing (as many times as necessary) and rolling the Pride Die. This can be done by clicking on the relevant buttons on the message displayed in the chat log. Rolling the Pride Die will automatically prevent further Pushing.

- Double clicking a spell name will pop up a dialog that will let the player enter relevant informations before casting the spell, like the number of Willpower points spent or if ingredients or a grimoire/scroll are being used.
If the spellcasting talent rank has been configured in the talents tab, the system will automatically compute the correct number of Willpower points the player can spend according to spell vs talent rank, including the effect of a grimoire/scroll. The mishap chance is displayed to help making an informed decision.

- Double clicking the name of an Armor piece will automatically roll an Armor check by adding together the armor values of the top-most Body armor and the top-most Head armor appearing on the Armor Tab on the character sheet. The order Armor pieces are displayed on the sheet can be re-arranged by dragging and dropping the items on the sheet.

- Hovering the mouse over an element name will cause a tooltip with additional information to show if/when relevant (for example, injury effects or the kind of check that a specific item will add a bonus die to can be displayed this way without cluttering the sheet). The tooltip text is configured in the item creation panel

- Double clicking an item icon (when interactable) will usually open the corresponding item sheet, allowing the user to modify the item (let's say a player character's Longsword has been damaged by one point and the Crafting roll to repair it fails. The player can double click the Longsword icon in the inventory and change the name of the item to "Worn Longsword" and its bonus to 1 instead of 2).

- Critical Injuries timers are automatically rolled when the injury is added to the character sheet. An injury can exist in one of three states:
    - Lethal: it's an injury that will kill the character if not treated. In order to make it stand out it's displayed with a full red background and a crossed bones skull icon on the sheet.
    - Open: a non lethal injury that has not been treated yet. A treated lethal injury will turn into an Open injury by double clicking its name
    - Healing: a treated injury. A treated Open injury can be turned into a Healing injury by double clicking its name. The healing time is automatically halved (rounded up) when an injury state is set to healing

- Double clicking the "plus" or "minus" icons next to any Consumable will increase or decrease its Die size.  
Double clicking a Cosnumable Die icon will roll a Consumable check and post its result to the chat. If the check is failed the die size will automatically be reduced one step.

- Double clicking a monster attack die icon will roll the corresponding attack and post it to the chat together with its description.  
Double clicking the "Monster Attack" title on the Monster sheet will randomly select a monster attack, roll it and post the result to the chat.

- Double clicking a Monster Armor name will roll an Armor check for the monster

- Dragging and Dropping an Attribute, Skill, Weapon, Equipment or Spell element from the character sheet to the macro bar will automatically add a macro that will perform the corresponding check once clicked.  
NB: a token must be selected for the macro to actually work. An error message will be displayed asking the player to select a single token if he didn't.

- To roll a Forbidden Land style dice-check for which no automation has been built, type the following command in the chat window:  
`/fbl(nAtt, nSkill, nGear, artifactDieOne, artifactDieTwo,...)`  
For example `/fbl(4, -1, 2, d10)` would roll 4 Base Dice, 1 negative Skill Die, 2 Gear Dice and a single d10 Artifact Die. This roll doesn't support pushing (yet?)

- Spells can't be added to the Character sheet directly. They are automatically added when a Spellcasting talent is dragged onto the character sheet and automatically removed when the Talent is removed.  
Make sure to correctly import the talents and spells by configuring the right magical discipline associated to each of them.

# Feedback 
Feedback is very welcome. Please report any bug and I will try to look into it as soon as possibile.  
Up to about the first week of april 2020 I didn't know anything about JS, HTML or CSS, except that they existed. So, I'm a noob at software development. That means the code behind this system will hardly be optimized. It's much more likely to be a monster of a spaghetti code mess. Sorry about that.

# Media
![](https://github.com/LeonardoFacchin/Foundry-VTT-Forbidden-Lands-System/blob/media/readme_images/ChacracterSheet2020-07-12_104534.png?raw=true)
![](https://github.com/LeonardoFacchin/Foundry-VTT-Forbidden-Lands-System/blob/media/readme_images/Monster_Sheet_2020-07-12_104739.png?raw=true)
![](https://github.com/LeonardoFacchin/Foundry-VTT-Forbidden-Lands-System/blob/media/readme_images/NPC_Sheet_2020-07-12_105043.png?raw=true)
![](https://github.com/LeonardoFacchin/Foundry-VTT-Forbidden-Lands-System/blob/media/readme_images/Melee_Check_Pushed_2020-07-12_105314.png?raw=true)
![](https://github.com/LeonardoFacchin/Foundry-VTT-Forbidden-Lands-System/blob/media/readme_images/Monster_Attack_Check2020-07-12_105520.png?raw=true)
![](https://github.com/LeonardoFacchin/Foundry-VTT-Forbidden-Lands-System/blob/media/readme_images/Spell_Casting_2020-07-12_105139.png?raw=true)
![](https://github.com/LeonardoFacchin/Foundry-VTT-Forbidden-Lands-System/blob/media/readme_images/Spell_Casting_Check_Annotation_2020-07-12_105635.png?raw=true)