import express, { json } from "express";
import db from "./database.js";

import cors from "cors";

const app = express();
app.use(json());
app.use(cors());

app.head("/user/display_name/:name", async (req, res) => {
  const display_name = req.params.name;
  if (await db.user_exists(display_name)) {
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.get("/message/:message_id", async (req, res) => {
  const message_id = +req.params.message_id;
  const data = await db.get_message_data(message_id);
  res.json(data);
});

app.put("/message", async (req, res) => {

  const body = req.body;

  const user_id = +body.user_id;
  const content = body.content;

  const x = +body.pos.x;
  const y = +body.pos.y;
  const z = +body.pos.z;

  await db.create_message({
    user_id: user_id, content: content, pos_x: x, pos_y: y, pos_z: z
  })

  res.sendStatus(200);
});

app.post("/nearby_messages/:user_id", async (req, res) => {

  const user_id = +req.params.user_id;

  const body = req.body;
  const x = +body.y;
  const y = +body.x;
  const z = +body.z;

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
