import { createPool } from "mysql2/promise";

const database_server = process.env.database_server || 'localhost';
const database_name = process.env.database_name || 'game';
const database_username = process.env.database_username || 'root';
const database_password = process.env.database_password || '';
const database_port = process.env.database_port || 3306;

const pool = {};

/* const pool = createPool({
  host: database_server,
  database: database_name,
  user: database_username,
  password: database_password,
  port: database_port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}); */

async function get_config_value(id) {

  const [rows,] = await pool.query('SELECT value FROM configuration WHERE id = ?', [id]);
  return rows[0].value;
}

async function user_exists(username) {

  const query = 'SELECT id FROM users WHERE display_name = ?';

  const [rows,] = await pool.query(query, [username]);

  if (rows.length === 0) {
    return { 'exists': false };
  } else {
    return { 'exists': true, 'id': rows[0].id };
  }
}

async function delete_message(message_id, user_id) {
  const res = await pool.execute("DELETE FROM messages WHERE id = ? AND user_id = ?", [message_id, user_id]);
  return res[0].affectedRows;
}

async function create_user(username) {

  const userData = await user_exists(username);

  if (userData.exists) {
    return { 'successful': false, error: 'User already exists' };
  }

  const query = `
  INSERT INTO users 
  (display_name)
  VALUES
  (?)`;

  const result = await pool.execute(query, [username]);

  const data = {
    id: result[0].insertId
  };

  return { successful: true, data: data };
}

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

  const [result,] = await pool.execute(query, [user_id, message, x, y, z]);
  return result.insertId;
}

async function get_nearby_messages(data) {
  const user_id = data.user_id;

  const x = data.x;
  const y = data.y;
  const z = data.z;

  const max_messages = +await get_config_value('max_fetch_messages');
  const max_message_distance = +await get_config_value('max_distance_fetch_messages');

  const max_sqr_message_distance = max_message_distance * max_message_distance;

  const query_others = `
  SELECT 
      m.id as message_id,
      m.user_id user_id,
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

  const [rows_others,] = await pool.query(query_others);

  const query_self = `
  SELECT 
      m.id as message_id,
      m.user_id user_id,
      m.pos_x as x,
      m.pos_y as y,
      m.pos_z as z,
      (m.pos_x - ${x}) * (m.pos_x - ${x}) +
        (m.pos_y - ${y}) * (m.pos_y - ${y}) +
        (m.pos_z - ${z}) * (m.pos_z - ${z}) 
      AS distance
  FROM messages m WHERE  m.user_id = ${user_id}
  HAVING distance < ${max_sqr_message_distance}
  ORDER BY distance DESC
  LIMIT ${max_messages}
  `;

  const [rows_self,] = await pool.query(query_self);

  return [...rows_others, ...rows_self];
}

async function get_message_data(message_id) {
  const query = `
    SELECT
      m.id as message_id,
      m.content as message_content,
      m.created_on as message_created_on,
      u.id as user_id,
      u.display_name as user_display_name
    FROM messages m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE m.id = ?
  `;

  const [rows,] = await pool.query(query, [message_id]);
  return rows.length == 1 ? rows[0] : {};
}

async function get_mail_count(user_id) {

  const query = "SELECT id FROM mails WHERE receiver_id = ? AND seen = 0";
  const [rows,] = await pool.query(query, [user_id]);

  return rows;
}

async function get_mail(user_id) {

  const query = `
  SELECT 
    m.id as mail_id,
    m.sender_id as sender_id,
    u.display_name as sender_display_name,
    m.content as message_content,
    m.seen as message_read,
    m.sent_on as message_sent_on
  FROM mails m 
  INNER JOIN users u 
    ON m.sender_id = u.id 
  WHERE 
    m.receiver_id = ?
  ORDER BY
    m.sent_on DESC`;

  const [rows,] = await pool.query(query, [user_id]);

  return rows;
}

async function mark_mail_as_seen(user_id, mail_id) {

  const query = `
    UPDATE mails
    SET seen = 1
    WHERE id = ? AND receiver_id = ?
  `;

  const [rows,] = await pool.query(query, [mail_id, user_id]);
  return rows.affectedRows == 1;
}

async function send_mail(sender_id, content) {

  const rand_user_query = "SELECT id FROM users WHERE id != ? ORDER BY RAND() LIMIT 1";

  // pick a random user
  const [rows,] = await pool.query(rand_user_query, [sender_id]);

  const receiver_id = rows[0].id;

  const query = `
      INSERT INTO mails 
      (sender_id, receiver_id, content)
      VALUES
      (?, ?, ?)
    `;

  await pool.execute(query, [sender_id, receiver_id, content]);
}

export default {
  create_message,
  get_nearby_messages,
  get_message_data,
  user_exists,
  create_user,
  delete_message,
  get_mail_count,
  get_mail,
  mark_mail_as_seen,
  send_mail
};