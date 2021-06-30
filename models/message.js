'use strict';

import mongoose from 'mongoose';
import { MessageRating } from './message_rating.js';

const messageSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', indexed: true, required: true },
    content: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
    cell_x: { type: Number, required: true },
    cell_z: { type: Number, required: true },
    cell_width: { type: Number, required: true },
    created_at: { type: Date, default: Date.now }
});

messageSchema.index({ cell_x: 1, cell_z: 1 });

messageSchema.pre('deleteOne', { document: false, query: true }, async function (next) {
    let id = this.getQuery()['_id'];
    await MessageRating.deleteMany({ message: id }).exec();
});

messageSchema.statics.messages_at_cell = async function (x, z) {

    const or_list = [];
    for (var i = -1; i <= 1; ++i) {
        for (var j = -1; j <= 1; ++j) {
            or_list.push({ cell_x: x + i, cell_z: z + j });
        }
    }

    return Message.aggregate()
        .match({ $or: or_list })
        .project({
            _id: "$_id",
            user_id: "$user",
            x: "$x",
            y: "$y",
            z: "$z"
        });
};

const Message = mongoose.model('Message', messageSchema);

export { Message };