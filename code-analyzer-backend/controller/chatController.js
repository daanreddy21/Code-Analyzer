const pool = require("../config/db");

// ✅ CREATE OR GET CONVERSATION
exports.getOrCreateConversation = async (req, res) => {
  const userId = req.userId;
  const { receiverId } = req.body;

  const existing = await pool.query(`
    SELECT c.id FROM conversations c
    JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
    JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
    WHERE cp1.user_id = $1 AND cp2.user_id = $2
    LIMIT 1
  `, [userId, receiverId]);

  if (existing.rows.length > 0) {
    return res.json({ conversationId: existing.rows[0].id });
  }

  const convo = await pool.query(
    "INSERT INTO conversations DEFAULT VALUES RETURNING id"
  );

  const convoId = convo.rows[0].id;

  await pool.query(`
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES ($1,$2), ($1,$3)
  `, [convoId, userId, receiverId]);

  res.json({ conversationId: convoId });
};

// ✅ SEND MESSAGE
exports.sendMessage = async (req, res) => {
  const { conversationId, message } = req.body;
  const senderId = req.userId;

  const result = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, message)
     VALUES ($1,$2,$3) RETURNING *`,
    [conversationId, senderId, message]
  );

  res.json(result.rows[0]);
};

// ✅ GET MESSAGES
exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;

  const result = await pool.query(`
    SELECT m.*, u.first_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE conversation_id = $1
    ORDER BY created_at ASC
  `, [conversationId]);

  res.json(result.rows);
};

// ✅ MARK AS READ
exports.markAsRead = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId;

  await pool.query(`
    UPDATE messages 
    SET is_read = true 
    WHERE conversation_id = $1 AND sender_id != $2
  `, [conversationId, userId]);

  res.json({ message: "Marked as read" });
};

// ✅ UNREAD COUNT (GLOBAL 🔴)
exports.getUnreadCount = async (req, res) => {
  const userId = req.userId;

  const result = await pool.query(`
    SELECT COUNT(*) FROM messages m
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE cp.user_id = $1 
      AND m.sender_id != $1 
      AND m.is_read = false
  `, [userId]);

  res.json({ unread: parseInt(result.rows[0].count) });
};

// ✅ GET USER CHAT LIST (SIDEBAR)
exports.getUserChats = async (req, res) => {
  const userId = req.userId;

  const result = await pool.query(`
    SELECT DISTINCT c.id as conversation_id,
           u.id as user_id,
           u.first_name,
           (
             SELECT COUNT(*) FROM messages m
             WHERE m.conversation_id = c.id 
             AND m.sender_id != $1 
             AND m.is_read = false
           ) as unread
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id
    JOIN users u ON u.id = cp.user_id
    WHERE c.id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = $1
    )
    AND u.id != $1
  `, [userId]);

  res.json(result.rows);
};
exports.getAllUsersForChat = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.role,

        -- 🔴 unread messages count per user
        (
          SELECT COUNT(*) FROM messages m
          JOIN conversation_participants cp 
            ON cp.conversation_id = m.conversation_id
          WHERE cp.user_id = $1
            AND m.sender_id = u.id
            AND m.is_read = false
        ) AS unread

      FROM users u
      WHERE u.id != $1
      ORDER BY u.role DESC, u.first_name ASC
    `, [userId]);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.markAsRead = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId;

  await pool.query(`
    UPDATE messages 
    SET is_read = true 
    WHERE conversation_id = $1 
      AND sender_id != $2
  `, [conversationId, userId]);

  res.json({ message: "Seen" });
};