'use strict';

import { User } from './models/user.js';
import { is_blank } from './utils.js';

async function login(req, res) {

    const name = req.params.name;

    if (is_blank(name)) {
        res.sendStatus(400);
        return;
    }

    try {

        const user = await User.findOne({ name: name }).lean();
        if (!user) {
            res.sendStatus(400);
            return;
        }

        res.json({ id: user._id });

    } catch (err) {
        console.error('Error during login:', err);
    }

}

async function create_user(req, res) {

    const name = req.params.name;

    if (is_blank(name)) {
        res.sendStatus(400);
        return;
    }

    try {

        if (await User.exists({ name: name })) {
            res.sendStatus(400);
            return;
        }

        var user = new User({ name: name });
        user = await user.save();

        res.sendStatus(201);

    } catch (err) {
        console.error('Error creating a new user: ', err);
        res.sendStatus(500);
    }
}

export default {
    create_user, login
}