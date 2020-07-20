// Import some relevant constants refrenced by most item types,
// like magic and weapon ranges, magical disciplines, spell durations, etc.
import { CONFIG_MAGIC_DISCIPLINES} from "./Config.js";

export class FBLItem extends Item {

    prepareData() {
        super.prepareData();
        const itemType = this.type;

        this._prepareData(itemType);
    }

    // // return relevant constants according to item type

    _prepareData(itemType) {
        if (itemType === "Spell") {
            // retrieve the magic discipline the spell belongs to and its rank
            // and use them to build the string of the icon url
            const discipline = this.data.data.discipline;
            if (Object.entries(discipline).length === 0) {return};
            const rank = this.data.data.rank;
            return this.data.data.image = CONFIG_MAGIC_DISCIPLINES[discipline].url;
            // return this.data.data.image = `${url}_0${rank}.svg`;
        }
    }
}