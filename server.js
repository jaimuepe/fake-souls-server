import express, { json } from "express";
import db from "./database.js";

import cors from "cors";

const app = express();
app.use(json());
app.use(cors());

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

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

// Retrieves the contents of a specific message
app.get("/message/:id", async (req, res) => {
  const message_id = +req.params.id;
  const data = await db.get_message_data(message_id);
  res.json(data);
});

// Creates a new message
app.put("/user/:user_id/message", async (req, res) => {

  const user_id = req.params.user_id;

  const body = req.body;
  const content = body.content;

  const x = +body.pos_x;
  const y = +body.pos_y;
  const z = +body.pos_z;

  if (isNaN(user_id) || user_id === 0 || isNaN(x) || isNaN(y) || isNaN(z) || !content) {
    res.sendStatus(400);
    return;
  }

  try {
    const insert_id = await db.create_message({
      user_id: user_id, content: content, pos_x: x, pos_y: y, pos_z: z
    });
    res.json({ "id": insert_id });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.delete("/user/:user_id/message/:message_id", async (req, res) => {

  const message_id = +req.params.message_id;
  const user_id = +req.params.user_id;

  const result = await db.delete_message(message_id, user_id);
  if (result) {
    res.sendStatus(204);
  } else {
    res.sendStatus(404);
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


app.post("/nearby_messages/:user_id", async (req, res) => {

  const user_id = +req.params.user_id;

  const body = req.body;
  const x = +body.y;
  const y = +body.x;
  const z = +body.z;

  if (isNaN(user_id) || user_id === 0 || isNaN(x) || isNaN(y) || isNaN(z)) {
    res.sendStatus(400);
    return;
  }

  const data = await db.get_nearby_messages({
    user_id: user_id,
    x: x,
    y: y,
    z: z,
  });

  res.json(data);
});

var port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("El servidor está inicializado en el puerto 3000");
});
