import express, { json } from "express";
import db from "./database.js";

import cors from "cors";

const app = express();
app.use(json());
app.use(cors());

app.get("/user/display_name/:name", async (req, res) => {

  const display_name = req.params.name;
  const user = await db.user_exists(display_name);
  res.json(user);
});

app.get("/message/:id", async (req, res) => {
  const message_id = +req.params.id;
  const data = await db.get_message_data(message_id);
  res.json(data);
});

app.put('/user/:name', async (req, res) => {

  const display_name = req.params.name;

  const result = await db.create_user(display_name);

  if (result.successful) {
    res.json(result.data);
  } else {
    res.status(400).json({
      status: 'error',
      message: result.error
    });
  }
});

app.put("/message", async (req, res) => {

  const body = req.body;

  const user_id = +body.user_id;
  const content = body.content;

  const x = +body.pos_x;
  const y = +body.pos_y;
  const z = +body.pos_z;

  if (isNaN(user_id) || user_id === 0 || isNaN(x) || isNaN(y) || isNaN(z) || !content) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid values'
    });
    return;
  }

  const result = await db.create_message({
    user_id: user_id, content: content, pos_x: x, pos_y: y, pos_z: z
  })

  if (result.successful) {
    res.json(result.data);
  } else {
    res.status(400).json({
      status: 'error',
      message: result.error
    });
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

app.post("/nearby_messages/:user_id", async (req, res) => {

  const user_id = +req.params.user_id;

  const body = req.body;
  const x = +body.y;
  const y = +body.x;
  const z = +body.z;

  if (isNaN(userId) || userId === 0 || isNaN(x) || isNaN(y) || isNaN(z)) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid values'
    });
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
