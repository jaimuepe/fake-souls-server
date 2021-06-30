'use strict';

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true }
});

const User = mongoose.model('User', userSchema);

export { User };