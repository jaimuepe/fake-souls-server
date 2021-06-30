'use strict';

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', indexed: true, required: true },
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

const Message = mongoose.model('Message', messageSchema);

export { Message };