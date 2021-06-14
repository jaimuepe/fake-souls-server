import { createPool } from "mysql2/promise";

const database_server = process.env.database_server || 'localhost';
const database_name = process.env.database_name || 'game';
const database_username = process.env.database_username || 'root';
const database_password = process.env.database_password || '';
const database_port = process.env.database_server || 3306;

console.log(database_server);
console.log(database_name);
console.log(database_username);
console.log(database_password);
console.log(database_port);

const pool = createPool({
  host: database_server,
  database: database_name,
  user: database_username,
  password: database_password,
  port: database_port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const max_messages = 10;
const max_message_distance = 10.0;
const max_sqr_message_distance = max_message_distance * max_message_distance;

async function create_message(data) {

  const user_id = data.user_id;
  const message = data.content;

  const x = data.pos_x;
  const y = data.pos_y;
  const z = data.pos_z;

  const query = `
    INSERT INTO messages 
    (user_id, content, pos_x, pos_y, pos_z)
    VALUES
    (?, ?, ?, ?, ?)
  `;

  await pool.execute(query, [user_id, message, x, y, z]);
}

async function get_nearby_messages(data) {
  const user_id = data.user_id;

  const x = data.pos_x;
  const y = data.pos_y;
  const z = data.pos_z;

  const query = `
  SELECT 
      m.id as message_id,
      m.pos_x as x,
      m.pos_y as y,
      m.pos_z as z,
      (m.pos_x - ${x}) * (m.pos_x - ${x}) +
        (m.pos_y - ${y}) * (m.pos_y - ${y}) +
        (m.pos_z - ${z}) * (m.pos_z - ${z}) 
      AS distance
  FROM messages m WHERE  m.user_id != ${user_id}
  HAVING distance < ${max_sqr_message_distance}
  ORDER BY distance DESC
  LIMIT ${max_messages}
  `;

  const [rows, _] = await pool.query(query);
  return rows;
}

async function get_message_data(message_id) {
  const query = `
    SELECT
      m.id as message_id,
      m.content as message_content,
      u.id as user_id,
      u.display_name as user_display_name
    FROM messages m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE m.id = ?
  `;

  const [rows, _] = await pool.query(query, [message_id]);
  return rows.length == 1 ? rows[0] : {};
}

export default {
  get_nearby_messages,
  get_message_data,
  create_message,
};
