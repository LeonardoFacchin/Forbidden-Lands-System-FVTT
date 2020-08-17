export class FBLChatMessage extends ChatMessage {

    constructor(data, options, fblRoll=null) {
        super(data, options);
        this.fblRoll = fblRoll || null;
    }

    static async create(data, options, fblRoll=null) {
        let msg = await super.create(data, options);
        msg.fblRoll = fblRoll || null;
        msg.fblRoll_id = fblRoll?._id || null;
        // console.log(msg);
        return msg;
    }
}