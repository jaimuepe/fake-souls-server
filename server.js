'use strict';

import express, { json } from "express";
import mongoose from 'mongoose';
import cors from "cors";
import login_service from './login_service.js';
import message_service from './message_service.js';
import { Config } from './config.js';

const mongodb_uri = process.env.MONGODB_URI || Config.MONGODB_URI;

mongoose.connect(mongodb_uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true }).then(() => {
  console.log('mongoDB connected');
}, (err) => {
  console.error('Failed to connect to mongoDB', err);
});

const app = express();
app.use(json());
app.use(cors());

// creates a new user
app.post('/user/:name', async (req, res) => {
  login_service.create_user(req, res);
});

// logs in a user
app.get('/user/:name/session', async (req, res) => {
  login_service.login(req, res);
});

// retrieves a message
app.get('/message/:id', (req, res) => {
  message_service.get_message(req, res);
});

// creates a new message
app.post('/message', (req, res) => {
  message_service.create_message(req, res);
});

// deletes a message
app.delete('/message/:id', (req, res) => {
  message_service.delete_message(req, res);
});

// gets the messages close to the player
app.get('/messages', async (req, res) => {
  message_service.get_nearby_messages(req, res);
});

// creates/updates a message rating
app.post('/rating', async (req, res) => {
  message_service.rate(req, res);
});

// gets a message total score
app.get('/message/:id/ratings/total', async (req, res) => {
  message_service.get_total_score(req, res);
});

// ------------------------- OLD

// Checks if a user exists by its display name.
app.get("/user/display_name/:name", async (req, res) => {

  const display_name = req.params.name;
  const user = await db.user_exists(display_name);
  res.json(user);
});

// Creates a new user
app.put('/user/:name', async (req, res) => {

  const display_name = req.params.name;

  const result = await db.create_user(display_name);

  if (result.successful) {
    res.json(result.data);
  } else {
    res.sendStatus(400);
  }
});

// get the # of mails for a user
app.get("/user/:id/mail/count", async (req, res) => {

  const user_id = +req.params.id;

  if (isNaN(user_id) || user_id === 0) {
    res.sendStatus(400);
    return;
  }

  const result = await db.get_mail_count(user_id);
  res.json(result.map(r => r.id));
});

// get the mails of a user
app.get("/user/:id/mail", async (req, res) => {

  const user_id = +req.params.id;

  if (isNaN(user_id) || user_id === 0) {
    res.sendStatus(400);
    return;
  }

  const result = await db.get_mail(user_id);
  res.json(result);
});

app.patch("/user/:user_id/mail/:mail_id/seen", async (req, res) => {

  const user_id = +req.params.user_id;
  const mail_id = +req.params.mail_id;

  if (isNaN(user_id) || user_id === 0 || isNaN(mail_id) || mail_id === 0) {
    res.sendStatus(400);
    return;
  }

  if (await db.mark_mail_as_seen(user_id, mail_id)) {
    res.sendStatus(204);
  } else {
    res.sendStatus(404);
  }
});

// Sends a mail
app.put("/user/:id/mail", async (req, res) => {

  const user_id = +req.params.id;
  const content = req.body.content;

  if (isNaN(user_id) || user_id === 0 || isBlank(content)) {
    res.sendStatus(400);
    return;
  }

  db.send_mail(user_id, content);
  res.sendStatus(204);
});

var port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("El servidor está inicializado en el puerto 3000");
});
