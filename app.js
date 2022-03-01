const { token, botChannel } = require("./config");
const commandHandler = require("./command-handler");
const musicPlayer = require("./music/music-player");

const client = require("./client");

function exitHandler(options, exitCode) {
  if (options.cleanup) {
    musicPlayer.stopMusic(null);
  }
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

//catches general purpose termination events, like systemd stopping a service
process.on("SIGTERM", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (message) => {
  if (message.content === "ping") {
    message.reply("Pong!");
  }

  if (message.content[0] === "/" || message.content[0] === "!") {
    await commandHandler.handleCommands(message);
  }

  if (message.content === "thank mr aloy") {
    message.react("❤");
  }
});

client.login(token);
