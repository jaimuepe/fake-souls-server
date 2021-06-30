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

var port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("El servidor está inicializado en el puerto 3000");
});
