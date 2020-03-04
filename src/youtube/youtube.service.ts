import {forwardRef, Inject, Injectable} from '@nestjs/common';
import {StorageService} from '../storage/storage.service';
import {SoundService} from '../sound/sound.service';
import {BotService, BotStatus} from '../bot/bot.service';
import {YoutubeGateway} from './youtube-gateway';
import {PlayerStatus} from './model/player-status';
import * as ytdlDiscord from './util/ytdl-wrapper';
import {TrackInfos} from './dto/track-infos';
import * as ytdl from 'ytdl-core';
import * as FFmpeg from 'fluent-ffmpeg';
import {PlayerState} from './model/player-state';
import {Sound} from '../sound/sound.entity';
import * as youtubeSearch from 'youtube-search';
import {YouTubeSearchOptions, YouTubeSearchResults} from 'youtube-search';

@Injectable()
export class YoutubeService {

  private playlist: TrackInfos[] = [];
  private status: PlayerStatus;
  private totalLengthSeconds: number;

  constructor(
    private readonly soundService: SoundService,
    private readonly storageService: StorageService,
    private readonly botService: BotService,
    @Inject(forwardRef(() => YoutubeGateway))
    private readonly youtubeGateway: YoutubeGateway,
  ) {
    const botStatus = this.botService.getInfos().status;
    this.status = botStatus === BotStatus.CONNECTED || botStatus === BotStatus.IN_VOICE_CHANNEL
      ? PlayerStatus.IDLE : PlayerStatus.NA;
    this.botService.onBotStatusUpdate(status => this.onBotStatusUpdate(status));
    this.youtubeGateway.onAddToPlaylist(track => this.onAddToPlaylist(track));
  }

  public async searchVideos(q: string): Promise<YouTubeSearchResults[]> {
    const opts: YouTubeSearchOptions = {
      maxResults: 10,
      key: process.env.YOUTUBE_API_KEY,
      type: 'video',
    };
    return new Promise((resolve, reject) => {
      youtubeSearch(q, opts, (err, results) => {
        if (err) {
          return reject(err);
        }
        return resolve(results);
      });
    });
  }

  public async uploadFromYoutube(url: string, name: string, categoryId: number): Promise<Sound> {
    return new Promise((resolve) => {
      const sound = this.soundService.createNewSoundEntity(name, categoryId);
      const stream = ytdl(url, {quality: 'lowestaudio'});
      FFmpeg({source: stream})
        .audioBitrate(128)
        .withNoVideo()
        .toFormat('opus')
        .save(this.storageService.getUploadDir() + '/' + sound.uuid)
        .on('end', () => {
          resolve(this.soundService.saveNewSoundEntity(sound));
        });
    });
  }

  public async playSoundFromYoutube(id: string) {
    const res = await ytdlDiscord.stream(
      `http://youtube.com/watch?v=${id}`,
      {highWaterMark: 1024 * 1024 * 10},
      ((current) => {
        this.youtubeGateway.sendProgressUpdate(current);
      }));
    this.totalLengthSeconds = res.totalLengthSeconds;
    this.botService.playFromStream(res.stream,
      () => {
        this.status = PlayerStatus.PLAYING;
        this.propagateState();
      },
      () => {
        this.status = PlayerStatus.IDLE;
        this.propagateState();
      });
  }

  public getPlaylist() {
    return this.playlist;
  }

  public getStatus() {
    return this.status;
  }

  public getState(): PlayerState {
    return {
      status: this.status,
      playlist: this.playlist,
      totalLengthSeconds: this.totalLengthSeconds,
    };
  }

  public play() {
    if (this.botService.isPlaying()) {
      this.botService.resumeStream();
    } else {
      this.playSoundFromYoutube(this.playlist[0].id);
    }
    this.status = PlayerStatus.PLAYING;
    this.propagateState();
  }

  public pause() {
    this.botService.pauseStream();
    this.status = PlayerStatus.PAUSED;
    this.youtubeGateway.sendStatusUpdate(this.status);
    this.propagateState();
  }

  public stop() {
    this.botService.stopStream();
    this.propagateState();
  }

  public next() {
    this.botService.stopStream();
    this.playlist.splice(0, 1);
    this.playSoundFromYoutube(this.playlist[0].id);
    this.propagateState();
  }

  private onBotStatusUpdate(status: BotStatus) {
    switch (status) {
      case BotStatus.IN_VOICE_CHANNEL:
        this.status = PlayerStatus.IDLE;
        break;
      case BotStatus.CONNECTED:
        this.status = PlayerStatus.NA;
        break;
      case BotStatus.DISCONNECTED:
        this.status = PlayerStatus.NA;
        break;
    }
    this.youtubeGateway.sendStatusUpdate(this.status);
  }

  private onAddToPlaylist(track: TrackInfos) {
    this.playlist.push(track);
    if (this.getStatus() === PlayerStatus.IDLE) {
      this.play();
    }
    this.propagateState();
  }

  private propagateState() {
    this.youtubeGateway.sendStateUpdate({
      status: this.status,
      playlist: this.playlist,
      totalLengthSeconds: this.totalLengthSeconds,
    });
  }
}
