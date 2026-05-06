const pool = require("../config/db");


// 🎯 Calculate reward based on score & bugs
const calculateReward = (score, bugs) => {
  let rewards = [];
  let totalPoints = 0;

  
  if (score >= 90) {
    rewards.push({ points: 50, reason: "High Score" });
    totalPoints += 50;
  } else if (score >= 75) {
    rewards.push({ points: 30, reason: "Good Score" });
    totalPoints += 30;
  } else {
    rewards.push({ points: 10, reason: "Needs Improvement" });
    totalPoints += 10;

    
    rewards.push({ points: 5, reason: "Learning Progress" });
    totalPoints += 5;
  }


  if (bugs === 0) {
    rewards.push({ points: 20, reason: "No Bugs" });
    totalPoints += 20;
  } else if (bugs <= 2) {
    rewards.push({ points: 10, reason: "Clean Code" });
    totalPoints += 10;
  }

  
  if (score === 100) {
    rewards.push({ points: 30, reason: "Perfect Score" });
    totalPoints += 30;
  }

  return { rewards, totalPoints };
};



const updateLevel = (points) => {
  if (points > 500) return "Expert";
  if (points > 200) return "Intermediate";
  return "Beginner";
};



const getBadges = (score, bugs) => {
  let badges = [];

  if (score >= 90) badges.push("🌟 High Performer");
  if (score === 100) badges.push("🏆 Perfect Score");

  if (bugs === 0) badges.push("🔥 Bug Free");
  else if (bugs <= 2) badges.push("🛠️ Clean Code");

  if (score >= 75 && bugs <= 2) badges.push("⚡ Efficient Code");


  if (score < 50) badges.push("📉 Needs Improvement");

  return badges;
};



exports.applyRewards = async (userId, submissionId, score, bugs) => {
  try {

    const existing = await pool.query(
      "SELECT reward_points FROM code_submissions WHERE id=$1",
      [submissionId]
    );


    if (existing.rows.length > 0 && existing.rows[0].reward_points > 0) {
      console.log("♻️ Re-analyzing → resetting old rewards");


      await pool.query(
        "UPDATE users SET points = GREATEST(points - $1, 0) WHERE id=$2",
        [existing.rows[0].reward_points, userId]
      );


      await pool.query(
        "UPDATE code_submissions SET reward_points = 0 WHERE id=$1",
        [submissionId]
      );
    }


    const { rewards, totalPoints } = calculateReward(score, bugs);
    const badges = getBadges(score, bugs);


    await pool.query(
      "UPDATE code_submissions SET reward_points=$1 WHERE id=$2",
      [totalPoints, submissionId]
    );


    await pool.query(
      "UPDATE users SET points = points + $1 WHERE id=$2",
      [totalPoints, userId]
    );


    if (badges.length > 0) {
      await pool.query(
        `UPDATE users 
         SET badges = (
           SELECT ARRAY(
             SELECT DISTINCT unnest(COALESCE(badges, '{}') || $1)
           )
         )
         WHERE id=$2`,
        [badges, userId]
      );
    }

 
    for (let r of rewards) {
      await pool.query(
        "INSERT INTO rewards(user_id, submission_id, points, reason) VALUES($1,$2,$3,$4)",
        [userId, submissionId, r.points, r.reason]
      );
    }


    const userRes = await pool.query(
      "SELECT points FROM users WHERE id=$1",
      [userId]
    );

    const totalUserPoints = userRes.rows[0].points;


    const level = updateLevel(totalUserPoints);

    await pool.query(
      "UPDATE users SET level=$1 WHERE id=$2",
      [level, userId]
    );

    return {
      points: totalPoints,
      level,
      badges,
      rewards
    };

  } catch (err) {
    console.error("applyRewards error:", err);
    throw err;
  }
};



exports.getUserRewards = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await pool.query(
      "SELECT points, level, badges FROM users WHERE id=$1",
      [userId]
    );

    const history = await pool.query(
      "SELECT points, reason, created_at FROM rewards WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5",
      [userId]
    );

    res.json({
      points: user.rows[0]?.points || 0,
      level: user.rows[0]?.level || "Beginner",
      badges: user.rows[0]?.badges || [],
      rewards: history.rows
    });

  } catch (err) {
    console.error("getUserRewards error:", err);
    res.status(500).json({ error: err.message });
  }
};