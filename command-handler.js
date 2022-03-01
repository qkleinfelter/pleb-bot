const musicCommands = require("./music/commands");

class CommandHandler {
  constructor() {
    this.commands = new Map();

    this.commands.set("set-icon", (message, args) => {
      if (args.length == 0) {
        message.reply("More arguments needed!");

        return;
      }

      updateGuildIcon(args[0]);
    });

    this._registerCommands(musicCommands);
  }

  _registerCommands(commands) {
    for (const command in commands) {
      this.commands.set(command, commands[command]);
    }
  }

  async handleCommands(message) {
    const contentWithoutPrefix = message.content.substr(1);
    const split = contentWithoutPrefix.split(" ");
    const commandName = split[0];
    const command = this.commands.get(commandName);

    if (command === undefined) {
      message.reply("Not a valid command!");

      return;
    }

    const args = [...split];

    args.shift();

    command(message, args);
  }
}

module.exports = new CommandHandler();
