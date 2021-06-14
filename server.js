import express, { json } from "express";
import db from "./database.js";

const app = express();
app.use(json());

app.get("/message/:message_id", async (req, res) => {
  var message_id = +req.params.message_id;
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
  const x = +body.pos_x;
  const y = +body.pos_y;
  const z = +body.pos_z;

  const data = await db.get_nearby_messages({
    user_id: user_id,
    pos_x: x,
    pos_y: y,
    pos_z: z,
  });

  res.json(data);
});

var port = process.env.PORT || serverPort;

app.listen(port, () => {
  console.log("El servidor está inicializado en el puerto 3000");
});