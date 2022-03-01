const musicPlayer = require("./music-player");

class SeekPosition {
  constructor(minutes, seconds) {
    this.minutes = minutes;
    this.seconds = seconds;
  }

  _formatInt(integer) {
    if (integer > 10) {
      return integer + "";
    } else {
      return "0" + integer;
    }
  }

  get totalSeconds() {
    return this.minutes * 60 + this.seconds;
  }

  get formatted() {
    return this._formatInt(this.minutes) + ":" + this._formatInt(this.seconds);
  }
}

function getSeekPosition(length) {
  const split = length.split(":");

  try {
    if (split.length > 1) {
      return new SeekPosition(parseInt(split[0]), parseInt(split[1]));
    } else {
      return new SeekPosition(0, parseInt(split[0]));
    }
  } catch (e) {
    return null;
  }
}

async function playSong(message, args) {
  if (args.length == 0) {
    message.reply("More arguments needed!");

    return;
  }

  if (!message.guild) {
    message.reply("You can only play songs on a server!");

    return;
  }

  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    message.reply("You need to join a voice channel first!");

    return;
  }

  await musicPlayer.playMusic(message.channel, voiceChannel, args.join(" "));
}

module.exports = {
  play: playSong,
  p: playSong,
  seek: async (message, args) => {
    if (args.length == 0) {
      message.reply("More arguments needed!");

      return;
    }

    const seekPosition = getSeekPosition(args[0]);

    if (seekPosition === null) {
      message.reply("Could not parse seek position!");

      return;
    }

    musicPlayer.seekToPosition(message.channel, seekPosition);
  },
  skip: async (_) => {
    musicPlayer.playNextItemInQueue();
  },
  pause: (message, _) => {
    musicPlayer.pauseMusic(message.channel);
  },
  resume: (message, _) => {
    musicPlayer.resumeMusic(message.channel);
  },
  stop: (message, _) => {
    musicPlayer.stopMusic(message.channel);
  },
  queue: (message, args) => {
    if (args.length == 0) {
      musicPlayer.sendQueue(message.channel, 1);
    } else {
      try {
        const pageNumber = parseInt(args[0]);

        musicPlayer.sendQueue(message.channel, pageNumber);
      } catch (e) {
        textChannel.send("That's not a page number!");
      }
    }
  },
};
