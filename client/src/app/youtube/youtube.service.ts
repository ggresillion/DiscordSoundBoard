import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as io from 'socket.io-client';
import { environment } from '../../environments/environment';
import { PlayerStatus } from './model/player-status';
import { HttpClient } from '@angular/common/http';
import { ClientEvents } from './model/client-events.enum';
import { ServerEvents } from './model/server-events.enum';
import { Socket } from 'socket.io';
import { TrackInfos } from './model/track-infos';
import { PlayerState } from './model/player-state';
import { GuildsService } from '../guilds/guilds.service';

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {

  public indexSong = 0;
  private stateSubject: BehaviorSubject<PlayerState> = new BehaviorSubject({
    playlist: [],
    status: PlayerStatus.IDLE,
    totalLengthSeconds: undefined
  });
  private progressSubject: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private currentTime = 0;
  private duration = 0;
  private socket: Socket;
  private currentGuild;

  constructor(
    private http: HttpClient,
    private guildsService: GuildsService
  ) {
    this.socket = io(environment.websocket + 'player')
      .on('connect', () => {
        this.guildsService.getSelectedGuild().subscribe(g => {
          this.currentGuild = g;
          this.socket.emit(ServerEvents.YT_JOIN_ROOM, { guildId: g.id });
        });
        this.bindToEvents();
      });
  }

  public addToPlaylist(track: TrackInfos) {
    this.socket.emit(ClientEvents.ADD_TO_PLAYLIST, { track });
  }

  public nextSong(): void {
    if ((this.indexSong + 1) >= this.stateSubject.value.playlist.length) {
      this.indexSong = 0;
    } else {
      this.indexSong++;
    }
    this.socket.emit(ClientEvents.NEXT);
  }

  public previousSong(): void {
    if ((this.indexSong - 1) < 0) {
      this.indexSong = (this.stateSubject.value.playlist.length - 1);
    } else {
      this.indexSong--;
    }
  }

  public resetPlaylist(): void {
    this.indexSong = 0;
  }

  public selectATrack(index: number): void {
    this.indexSong = index - 1;
  }

  public getState(): Observable<PlayerState> {
    return this.stateSubject.asObservable();
  }

  public searchYoutube(searchString: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.api}/youtube/search?q=${searchString}`);
  }

  public play() {
    this.socket.emit(ClientEvents.PLAY);
  }

  public stop() {
    this.socket.emit(ClientEvents.STOP)
  }

  public pause() {
    this.socket.emit(ClientEvents.PAUSE);
  }

  public getProgress(): Observable<number> {
    return this.progressSubject.asObservable();
  }

  public moveTrackUpwards(index: number): void {
    this.socket.emit(ClientEvents.MOVE_UPWARDS, { index });
  }

  public moveTrackDownwards(index: number): void {
    this.socket.emit(ClientEvents.MOVE_DOWNWARDS, { index });
  }

  public removeFromPlaylist(index: number): void {
    this.socket.emit(ClientEvents.REMOVE_FROM_PLAYLIST, { index });
  }

  private bindToEvents() {
    this.socket.on(ServerEvents.YT_SYNC, data => {
      const state = data.state;
      this.stateSubject.next({
        status: state.status,
        playlist: state.playlist,
        totalLengthSeconds: state.totalLengthSeconds,
      });
    });
    this.socket.on(ServerEvents.YT_STATUS_UPDATED, data => this.onStatusUpdate(data.status));
    this.socket.on(ServerEvents.YT_ADD_TO_PLAYLIST, data => this.onAddToPlaylist(data.track));
    this.socket.on(ServerEvents.YT_GET_PLAYLIST, playlist => this.onStateUpdate(playlist));
    this.socket.on(ServerEvents.YT_STATE_UPDATED, data => this.onStateUpdate(data.state));
    this.socket.on(ServerEvents.YT_PROGRESS_UPDATED, data => this.onProgressUpdate(data.progressSeconds));
  }

  private onStatusUpdate(status: PlayerStatus) {
    this.onStateUpdate({ status });
  }

  private onStateUpdate(state: Partial<PlayerState>) {
    this.stateSubject.next({ ...this.stateSubject.value, ...state });
  }

  private onAddToPlaylist(track) {
    this.onStateUpdate({ playlist: [...this.stateSubject.value.playlist, track] });
  }

  private onProgressUpdate(progressSeconds: number) {
    this.progressSubject.next(progressSeconds);
  }
}
