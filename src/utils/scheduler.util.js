const cron = require("node-cron");
const { sendWeatherReportToAllUsers } = require("../services/user.service");

//  declare scheduleTimes
//const scheduleTime = "*/1 * * * *"; // 1min
const scheduleTime = "* */3 * * *"; // 3 hours

module.exports = () => {
  cron.schedule(scheduleTime, () => {
    console.log("Running email sending job...");
    sendWeatherReportToAllUsers();
  });
};
