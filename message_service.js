'use strict';

import { User } from './models/user.js';
import { Message } from './models/message.js';
import { is_blank } from './utils.js';

// TODO this should be retrieved from somewhere
const CELL_WIDTH = 80;

async function create_message(req, res) {

    const body = req.body;

    const user_id = body.user_id;
    const content = body.content;
    const x = +body.x;
    const y = +body.y;
    const z = +body.z;

    if (is_blank(user_id) || is_blank(content) || isNaN(x) || isNaN(y) || isNaN(z)) {
        res.sendStatus(400);
        return;
    }

    const [cell_x, cell_z] = get_cell_coords(x, z);

    try {

        var message = new Message({ user_id: user_id, content: content, x: x, y: y, z: z, cell_x: cell_x, cell_z: cell_z, cell_width: CELL_WIDTH });
        message = await message.save();

        res.json(message);

    } catch (err) {
        console.error('Error during create_message: ', err);
        res.sendStatus(500);
    }
}

async function delete_message(req, res) {

    const message_id = req.params.id;
    const user_id = req.body.user_id;

    if (is_blank(message_id) || is_blank(user_id)) {
        res.sendStatus(400);
        return;
    }

    try {
        await Message.deleteOne({ '_id': message_id, 'user_id': user_id });
        res.sendStatus(204);
    } catch (err) {
        console.error('Error during delete_message: ', err);
        res.sendStatus(500);
    }
}

async function get_nearby_messages(req, res) {

    const body = req.body;

    const user_id = body.user_id;
    const x = +body.x;
    const z = +body.z;

    if (is_blank(user_id) || isNaN(x) || isNaN(z)) {
        res.sendStatus(400);
        return;
    }

    try {

        if (!await User.exists({ _id: user_id })) {
            res.sendStatus(400);
            return;
        }

        const [cell_x, cell_z] = get_cell_coords(x, z);

        const or_list = [];
        for (var i = -1; i <= 1; ++i) {
            for (var j = -1; j <= 1; ++j) {
                or_list.push({ cell_x: cell_x + i, cell_z: cell_z + j });
            }
        }

        const messages = await Message.find(
            { $or: or_list },
            '-cell_x -cell_z -cell_width -content').lean();

        res.json(messages);

    } catch (err) {
        console.error('Error during get_nearby_messages: ', err);
        res.sendStatus(500);
    }
}

function get_cell_coords(x, z) {

    const cell_x = Math.floor((x + 0.5 * CELL_WIDTH) / CELL_WIDTH);
    const cell_z = Math.floor((x + 0.5 * CELL_WIDTH) / CELL_WIDTH);

    return [cell_x, cell_z];
}

export default {
    create_message,
    delete_message,
    get_nearby_messages
}