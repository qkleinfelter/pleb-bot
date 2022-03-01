const ytdl = require("ytdl-core");
const yts = require("yt-search");
const { URL } = require("url");
const Discord = require("discord.js");
const { queuePageLength } = require("../default-config");

const State = {
  DOING_NOTHING: 0,
  PLAYING: 1,
  PAUSED: 2,
};

class QueueItem {
  constructor(textChannel, info, url) {
    this.textChannel = textChannel;
    this.stream = null;
    const videoDetails = info.videoDetails;
    this.title = videoDetails.title;
    const length = parseInt(videoDetails.lengthSeconds);
    const minutes = Math.floor(length / 60);
    const seconds = length % 60;
    let secondsStr;
    if (seconds < 10) {
      secondsStr = "0" + seconds;
    } else {
      secondsStr = seconds + "";
    }
    this.length = `${minutes}:${secondsStr}`;
    this.url = url;
  }

  updateStream() {
    this.stream = ytdl(this.url, { filter: "audioonly" });
  }
}

class MusicPlayer {
  constructor() {
    this.queue = [];
    this.voiceChannel = null;
    this.connectionToChannel = null;
    this.dispatcher = null;
    this.state = State.DOING_NOTHING;
  }

  async playMusic(textChannel, voiceChannel, query) {
    if (query.startsWith("youtube.com")) {
      query += "https://";
    }

    if (query.startsWith("http://")) {
      query = query.replace("http://", "https://");
    }

    try {
      const url = new URL(query);

      if (
        url.origin !== "https://youtube.com" &&
        url.origin !== "https://www.youtube.com"
      ) {
        textChannel.send("Aloy only supports playing YouTube videos.");

        return;
      }
    } catch (e) {
      const response = await yts(query);

      if (response.videos.length > 0) {
        query = response.videos[0].url;
      } else {
        textChannel.send("No videos found!");

        return;
      }
    }

    if (this.voiceChannel === null) {
      this.voiceChannel = voiceChannel;
      this.connectionToChannel = await this.voiceChannel.join();
    }

    const queueItem = new QueueItem(
      textChannel,
      await ytdl.getBasicInfo(query),
      query
    );

    queueItem.updateStream();

    this.queue.push(queueItem);

    if (this.queue.length === 1) {
      this.playFirstItemInQueue();
    } else {
      textChannel.send(
        `Added ${queueItem.title} (${queueItem.length}) (<${queueItem.url}>) to the queue.`
      );
    }
  }

  playFirstItemInQueue(seekPosition) {
    if (this.queue.length === 0) {
      this.stopMusic();

      return;
    }

    const queueItem = this.queue[0];

    if (this.state === State.PLAYING) {
      this.stopCurrentSong();
    }

    this.state = State.PLAYING;

    if (seekPosition === null || seekPosition === undefined) {
      queueItem.textChannel.send(
        `Playing ${queueItem.title} (${queueItem.length}) (<${queueItem.url}>).`
      );

      this.dispatcher = this.connectionToChannel.play(queueItem.stream);
    } else {
      queueItem.updateStream();
      this.dispatcher = this.connectionToChannel.play(queueItem.stream, {
        seek: seekPosition.totalSeconds,
      });
    }

    this.dispatcher.on("finish", () => {
      this.queue.shift();
      this.playFirstItemInQueue();
    });
  }

  seekToPosition(textChannel, seekPosition) {
    if (this.state !== State.PLAYING) {
      textChannel.send("Not playing music!");

      return;
    }

    this.playFirstItemInQueue(seekPosition);

    textChannel.send(`Seeking to ${seekPosition.formatted}.`);
  }

  playNextItemInQueue() {
    this.queue.shift();
    this.playFirstItemInQueue();
  }

  sendQueue(textChannel, page) {
    const totalPages = Math.ceil(this.queue.length / queuePageLength);

    if (this.queue.length === 0) {
      textChannel.send("No items are in the queue.");

      return;
    }

    if (page <= 0) {
      textChannel.send(`Really? ${page} as a page?`);

      return;
    }

    if (page > totalPages) {
      textChannel.send("There are not that many pages in the queue.");

      return;
    }

    const embed = new Discord.MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Music Queue");

    embed.addField(
      `Items in queue: (Page ${page} of ${totalPages})`,
      "\u200b",
      false
    );

    const beginningIndex = (page - 1) * queuePageLength;

    for (
      let i = beginningIndex;
      i < beginningIndex + queuePageLength && i < this.queue.length;
      i++
    ) {
      const queueItem = this.queue[i];

      embed.addField(
        `${i + 1}. ${queueItem.title} (${queueItem.length}) (<${
          queueItem.url
        }>)`,
        "\u200b",
        false
      );
    }

    textChannel.send(embed);
  }

  pauseMusic(textChannel) {
    this.dispatcher.pause();

    this.state = State.PAUSED;

    textChannel.send("Paused music.");
  }

  resumeMusic(textChannel) {
    this.dispatcher.resume();

    this.state = State.PLAYING;

    textChannel.send("Resumed music.");
  }

  stopCurrentSong() {
    this.state = State.DOING_NOTHING;

    if (this.dispatcher !== null) {
      this.dispatcher.destroy(); // end the stream

      this.dispatcher = null;
    }
  }

  stopMusic(textChannel) {
    this.stopCurrentSong();

    this.queue = [];

    if (this.connectionToChannel !== null) {
      this.connectionToChannel.disconnect();

      this.connectionToChannel = null;
      this.voiceChannel = null;
    }

    if (textChannel !== undefined && textChannel !== null) {
      textChannel.send("Stopped playing music.");
    }
  }
}

module.exports = new MusicPlayer();
