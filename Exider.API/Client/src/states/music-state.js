import { makeAutoObservable } from "mobx";
import FileAPI from "../services/cloud/api/FileAPI";
import storageState from "./storage-state";

class MusicState {
    songQueue = []
    currentSongIndex = 0;
    isPlaying = false;
    loadPercentage = 0;
    time = 0;

    constructor() {
        makeAutoObservable(this);
    }

    SetSongQueue(songs) {
        if (songs && songs.filter) {
            this.songQueue = songs.filter(element => element.type ? 
                FileAPI.musicTypes.includes(element.type) : null);
        }
    }

    SetSongAsPlaying(id) {
        const index = this.songQueue.findIndex(element => element.id === id);

        if (index === this.currentSongIndex) {
            this.isPlaying = !this.isPlaying;
            return;
        }

        if (index === -1) {
            this.songQueue = [...this.songQueue, {id: id}];
            this.currentSongIndex = this.songQueue.length - 1;
        } else {
            this.currentSongIndex = index;
        }

        this.isPlaying = true;
    }

    setTime(timeValue) {
        const isExist = this.songQueue.length > 0 && this.songQueue[this.currentSongIndex] && 
            this.songQueue[this.currentSongIndex].id;
 
        if (isExist && storageState.FindFileById(this.songQueue[this.currentSongIndex].id).durationTicks >= timeValue) {
            this.time = timeValue;
        }
    }

    ChangePlayingState() {
        this.isPlaying = !this.isPlaying;
    }

    GetCurrentSongId() {
        if (this.songQueue[this.currentSongIndex] && this.songQueue[this.currentSongIndex].id) {
            return this.songQueue[this.currentSongIndex].id;
        }

        return null;
    }

    setProgress(progress) {
        this.loadPercentage = progress;
    }
}

export default new MusicState();