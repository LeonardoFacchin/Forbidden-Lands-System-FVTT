## Foundry VTT - Forbidden Lands System

**version**: 0.1.0  
**supported browsers**: Chrome, Edge  
(NB: Firefox won't display character sheets as intended. Right now I'm incliend not to bother trying to make the system work with Firefox, mostly because on my PC Firefox performance was way worse than Edge's or Chrome's. If enough people are **really really** interested I might change my mind, but I suggest using Chrome to be on the safe side)

# Features not yet supported
- No Stronghold sheet, nor functions
- No custom initiative tracker (that is: right now my system doesn't offer a way to set the initiatve score according to card draws as for the FBL rules, nor to track the expenditure of slow and fast actions. These features require to modify the combat tracker entity, something I have not yet looked into)
- No Hidden Combinations advanced combat
- No way to track Poisoned or Diseased state on the character sheet (use tokens state as a stopgap, please)

# Supported features and mechanics
- Sheets for the three actor types: PCs, NPCs and Monsters
- Sheets for:
    - Monster Attacks, Monster Special Abilities
    - Talents, Spells, Critical Injuries
    - Weapons, Armor, Equipment

The system supports drag and dropping items onto the actor sheet in order to embed items into actors.
The advantage is that once you have created the items you need to run your sessions you will have to type very little on the actor sheets. If you want your character to have a sword you will just have to drag the sword from the World Items or Compendium panales and the sword will be added to your character inventory. Same goes for Equipment, Talents, Injuries, etc.  
The downside is that before using the system you will have to import all those items from the rulebook. I can't include those in the system as Compendium entities because it's copyrighted content.

# Automation 
Most dice checks you will require to make during the game are automated to some extent.
As a general rule, if an element on the actor sheet gets highlighted in orange when hovering your mouse, then that element can be interacted with according to the following guidelines:
- Double clicking an attribute, skill, weapon or equipment name will roll the corresponding check, automatically retrieving all the required informations. For example, if you double click your weapon name, an attack roll will be made adding together your character relevant current attribute value, skill and the current gear bonus of the weapon, including artifact dice modifiers.
Injuries and Talents effects are **NOT** automatically included in the computation. Character's and NPC's sheets have a modifier track that allows you to add a modifier to the roll (range: -6 to + 6) and up to 3 d8 artifact dice (to account for Talents, for example).
All these rolls support Pushing (an indefinite number of times, if necessary) and rolling the Pride Die. This is done by clicking on the relevant button on the message displayed in the chat window. Rolling the Pride Die will automatically prevent further Pushing.

- Double clicking a spell name will pop up a dialog that will allow the player to enter relevant informations before casting the spell, like the number of Willpower points spent or if ingredients or a grimoire/scroll are being used.
If the spellcasting talent rank is correctly set in the talents tab, the system will automatically compute the correct number of Willpower points the player can spend according to spell vs talent rank, including the effect of a grimoire/scroll. The mishap chance is displayed to help making an informed decision.

- Double clicking the name of an Armor piece will automatically roll an Armor check by adding together the armor values of the first Body armor and the first Head armor appearing on the Armor Tab on the character sheet. Armor order can be re-arranged by dragging and dropping the armor pieces in the list.

- Hovering your mouse over an element name will cause a tooltip with additional information to show when relevant (for example, you can show injury effects or the kind of check that a specific item will add a bonus die to). The tooltip text is configured from the item creation panel

- Double clicking an item icon (when interactable) will usually open the corresponding item sheet, allowing the player to modify the item if necessary (for example: let's say a player Longsword have been damaged by one point and the Crafting roll to repair it fails. The player can double click the Longsword icon in the inventory and change the name of the item to "Worn Longsword" and its bonus to 1 instead of 2).

- Critical Injuries relavant time attributes are automatically rolled when the injury is added to the character sheet. An injury can exist in three states:
    - Lethal: it's an injury that will kill the character if not treated. In order to make it stand out it's displayed with a full red background and a crossed bones skull icon on the sheet.
    - Open: a non lethal injury that has not been treated yet. A treated lethal injury will turn into an Open injury by double clicking its name
    - Healing: a treated injury. A treated Open injury can be turned into a healing injury by double clicking its name. The healing time is automatically halved (rounded up) when an injury state is set to healing

- Double clicking the "plus" or "minus" icons next to any Consumable will increase or decrease the Die size of the corresponding consumable.  
Double clicking a Cosnumable Die icon will roll a Consumable check and post its result to the chat. If the check is failed the die size will automatically be reduced one step.

- Double clicking a monster attack die icon will roll the relevant attack and post it to the chat together with a description of the attack effects.  
Double clicking the "Monster Attack" title on the Monster sheet will randomly select a monster attack, roll it and post the result to the chat.
Monster attacks can not be pushed because the rules forbid it.

- Double clicking a Monster Armor name will roll an Armor check for the monster

- Dragging and Dropping an Attribute, Skill, Weapon, Equipment or Spell element from the character sheet to the macro bar will automatically add a macro that will perform the corresponding check once clicked.  
NB: a token must be selected for the macro to actually work. An error message will be displayed asking the player to select a single token if he didn't before clicking the button.

# Feedback 
Feedback is very welcome. Please report any bug and I will try to look at them as soon as possibile.
Up to about the first week of april 2020 I didn't know anything about JS, HTML or CSS, except that they existed. So, I'm a noob at software development. That means the code behind this system will hardly be optimized. It's much more likely to be a monster of a spaghetti code mess. Sorry about that.
