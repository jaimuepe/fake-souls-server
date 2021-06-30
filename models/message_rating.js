'use strict';

import mongoose from 'mongoose';

const messageRatingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
    rating: Number,
    created_at: { type: Date, default: Date.now }
});

messageRatingSchema.index({ message: 1 });
messageRatingSchema.index({ user: 1, message: 1 }, { unique: true });

messageRatingSchema.statics.total_score = async function (message_id) {

    const cur = await this.aggregate([
        {
            $match: { message: new mongoose.Types.ObjectId(message_id) }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$rating' }
            }
        }
    ]);

    if (cur.length == 0) {
        return 0;
    }

    return cur[0].total;
};

const MessageRating = mongoose.model('MessageRating', messageRatingSchema);

export { MessageRating };