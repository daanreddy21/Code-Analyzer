const cron = require("node-cron");
const { runSmartReminder } = require("../controller/reminderController");

// 🔥 RUN EVERY MINUTE (TESTING)
cron.schedule("* * * * *", async () => {
  console.log("⏰ Cron Running...");
  await runSmartReminder();
});

module.exports = {};