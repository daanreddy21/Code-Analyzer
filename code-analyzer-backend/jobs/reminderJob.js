
const cron = require("node-cron");
const { runSmartReminder } = require("../controller/reminderController");

// ⏰ RUN EVERY DAY AT 9 AM
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Daily Smart Reminder Running...");
  await runSmartReminder();
}, {
  timezone: "Asia/Kolkata"
});

module.exports = {};