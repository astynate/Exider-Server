import { instance } from '../state/Interceptors';
import { makeAutoObservable, runInAction, toJS } from "mobx";
import applicationState from './application-state';
import { AdaptId } from './storage-state';

class GalleryState {

    //////////////////////////////////////////////////////////////////////////////////////

    albums = {};
    albumsQueueId = 0;
    albumCommentQueueId = 0;

    //////////////////////////////////////////////////////////////////////////////////////

    constructor() {
        makeAutoObservable(this);
    }

    //////////////////////////////////////////////////////////////////////////////////////

    AddToAlbum(photo, albumId) {
        photo.strategy = 'file';

        runInAction(() => {
            if (albumId !== null && albumId !== '' && this.albums[albumId] && this.albums[albumId].photos) {
                this.albums[albumId].photos = [photo, ...this.albums[albumId].photos];
            }
        });
    }

    //////////////////////////////////////////////////////////////////////////////////////

    CreateLoadingAlbum(name) {
        const album = {
            id: null,
            name: name,
            queueId: this.albumsQueueId,
            isLoading: true,
            strategy: 'loading',
        }

        runInAction(() => {
            this.albums[this.albumsQueueId] = album;
            this.albumsQueueId++;
        });

        return album.queueId;
    }

    UpdateAlbum(id, coverAsBytes, name, description) {
        if (this.albums[id]) {
            if (coverAsBytes !== null && coverAsBytes !== '' && coverAsBytes !== undefined) {
                this.albums[id].cover = coverAsBytes;
            }
            this.albums[id].name = name;
            this.albums[id].description = description;
        }
    }

    ReplaceLoadingAlbum(album, queueId) {
        if (album) {
            album.photos = []
            album.hasMore = true;
    
            delete this.albums[queueId];
            this.albums[album.id] = album;
        }
    }

    SetAlbumAsLoading(id) {
        if (this.albums[id]) {
            this.albums[id].isLoading = true;
        }
    }

    SetAlbumAsNormal(id) {
        if (this.albums[id]) {
            this.albums[id].isLoading = false;
        }
    }

    async GetAlbumRequest(route) {
        await instance
            .get(route)
            .then(response => {
                for (let i = 0; i < response.data.length; i++) {
                    if ((response.data[i].id in this.albums) === false) {
                        response.data[i].photos = []
                        response.data[i].hasMore = true;

                        this.albums[response.data[i].id] = response.data[i];
                    }
                }
            })
    }

    async GetAlbums() {
        this.GetAlbumRequest('/api/albums');
    } 

    async GetPlaylists() {
        this.GetAlbumRequest('/api/playlists');
    }

    DeleteAlbumById(id) {
        delete this.albums[id];
    }

    async GetAlbumPhotos(id) {
        if (this.albums[id] && this.albums[id].hasMore === true) {
            const count = 15;
            this.albums[id].hasMore = false;

            await instance
                .get(`/api/album?id=${id}&from=${this.albums[id].photos.length > 0 ? this.albums[id].photos.length : 0}&count=${count}`)
                .then(response => {
                    this.albums[id].hasMore = response.data.length !== 0;
                    this.albums[id].photos = [...this.albums[id].photos, ...response.data];
                })
                .catch((error) => {
                    console.error(error);
                })
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////// 

    async GetAlbumComments(albumId) {
        albumId = AdaptId(albumId);

        if (albumId && !this.albums[albumId].comments) {
            await instance
                .get(`/api/album-comments?albumId=${albumId}`)
                .then(response => {
                    this.albums[albumId].comments = response.data;
                })
                .catch(error => {
                    applicationState.AddErrorInQueue(error.response.data);
                })
        }
    }

    async AddUploadingAlbumComment(text, user, albumId) {
        const comment = {
            comment: {
                text
            },
            user: user,
            isUploading: true,
            queueId: this.albumCommentQueueId
        }

        if (albumId && this.albums[albumId]) {
            this.albums[albumId].comments = [comment, ...this.albums[albumId].comments];

            await instance
                .post(`/api/album-comments?albumId=${albumId}&text=${text}&queueId=${comment.queueId}`)
                .catch(error => {
                    applicationState.AddErrorInQueue(error.response.data);
                    this.DeleteCommentByQueueId(comment.queueId, albumId);
                })
        }
        
        this.albumCommentQueueId++;
    }

    ReplaceLoadingComment(comment, queueId, albumId) {
        if (this.albums[albumId] && this.albums[albumId].comments && this.albums[albumId].comments.map) {
            this.albums[albumId].comments = this.albums[albumId].comments.map(element => {
                if (element.queueId === queueId){
                    element = comment;
                }

                return element;
            });
        }
    }

    DeleteComment(id, albumId) {
        if (this.albums[albumId] && this.albums[albumId].comments) {
            this.albums[albumId].comments = this.albums[albumId].comments
                .filter(element => element.comment.id !== id);
        }
    }

    DeleteCommentByQueueId(queueId, albumId) {
        if (this.albums[albumId] && this.albums[albumId].comments) {
            this.albums[albumId].comments.filter(element => element.queueId !== queueId);
        }
    }

    SetCommentAsLoading(id) {
        Object.entries(this.albums).forEach(([key, _]) => {
            if (this.albums[key].comments) {
                this.albums[key].comments = this.albums[key].comments
                    .map(element => {
                        if (element.id === id) {
                            element.isUploading = true;
                        }
                        return element;
                    });
            }
        });
    }

    SetCommentAsNormal(id) {
        Object.entries(this.albums).forEach(([key, _]) => {
            if (this.albums[key].comments) {
                this.albums[key].comments = this.albums[key].comments
                    .map(element => {
                        if (element.id === id) {
                            element.isUploading = false;
                        }
                        return element;
                    });
            }
        });
    }

    DeleteCommentById(id) {
        Object.entries(this.albums).forEach(([key, _]) => {
            if (this.albums[key].comments) {
                this.albums[key].comments = this.albums[key].comments
                    .filter(element => element.id !== id);
            }
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////// 

    SetAlbumAccess(users, albumId) {
        if (this.albums[albumId] && users) {
            this.albums[albumId].users = []

            if (users.length) {
                this.albums[albumId].users = [...users, ...this.albums[albumId].users];
            } else {
                users.isOwner = true;
                this.albums[albumId].users = [users, ...this.albums[albumId].users];
            }
        }
    }

    DeleteAlbumUsers(albumId) {
        if (this.albums[albumId] && this.albums[albumId].users) {
            delete this.albums[albumId].users;
        }
    }

    UpdateAlbumViews(id, views) {
        if (this && this.albums && this.albums[id] && this.albums[id].views) {
            this.albums[id].views = views;
        }

        console.log(this.albums[id]);
    }

    ////////////////////////////////////////////////////////////////////////////////////// 
}

export default new GalleryState();