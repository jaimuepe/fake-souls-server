'use strict';

import { User } from './models/user.js';
import { Message } from './models/message.js';
import { MessageRating } from './models/message_rating.js';

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

        var message = new Message({ user: user_id, content: content, x: x, y: y, z: z, cell_x: cell_x, cell_z: cell_z, cell_width: CELL_WIDTH });
        message = await message.save();

        res.json(message);

    } catch (err) {
        console.error('Error during create_message: ', err);
        res.sendStatus(500);
    }
}

async function delete_message(req, res) {

    const message_id = req.params.message_id;
    const user_id = req.params.user_id;

    if (is_blank(message_id) || is_blank(user_id)) {
        res.sendStatus(400);
        return;
    }

    try {
        await Message.deleteOne({ _id: message_id, user: user_id });
        res.sendStatus(204);
    } catch (err) {
        console.error('Error during delete_message: ', err);
        res.sendStatus(500);
    }
}

async function get_message(req, res) {

    const id = req.params.id;

    if (is_blank(id)) {
        res.sendStatus(400);
        return;
    }

    try {
        const message = await Message.findById(id).populate("user", '_id, name').lean();
        res.json({
            _id: message._id,
            content: message.content,
            created_at: message.created_at,
            user_id: message.user._id,
            user_name: message.user.name
        });
    } catch (err) {
        console.error('Error during get_message: ', err);
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

        const messages = await Message.messages_at_cell(cell_x, cell_z);
        res.json(messages);

    } catch (err) {
        console.error('Error during get_nearby_messages: ', err);
        res.sendStatus(500);
    }
}

async function rate(req, res) {

    const body = req.body;
    const user_id = body.user_id;
    const message_id = body.message_id;

    const rating = +body.rating;

    if (is_blank(user_id) || is_blank(message_id) || isNaN(rating)) {
        res.sendStatus(400);
        return;
    }

    try {

        const update = { rating: rating };

        await MessageRating.updateOne({ message: message_id, user: user_id }, update, { upsert: true });
        res.sendStatus(204);

    } catch (err) {
        console.error('Error during rate: ', err);
        res.sendStatus(500);
    }
}

async function get_total_score(req, res) {

    const message_id = req.params.message_id;
    const user_id = req.params.user_id;

    if (is_blank(message_id) || is_blank(user_id)) {
        res.sendStatus(400);
        return;
    }

    try {

        const total_score = await MessageRating.total_score(message_id);
        var my_rating = await MessageRating.find({ message: message_id, user: user_id }, 'rating').lean();

        my_rating = my_rating.length == 0 ? 0 : my_rating[0].rating;

        res.json({ message_id: message_id, total_score: total_score, my_rating: my_rating });
    } catch (err) {
        console.error('Error during get_total_score: ', err);
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
    get_message,
    get_nearby_messages,
    rate,
    get_total_score,
}