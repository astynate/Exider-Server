﻿import React, { useLayoutEffect } from 'react'
import { useState, useEffect } from 'react';
import { createSignalRContext } from "react-signalr/signalr";
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import Desktop from './Desktop';
import Mobile from './Mobile';
import ApplicationState from '../../../state/application/ApplicationState';
import AccountState from '../../../state/entities/AccountState';
import WebsocketListener from '../api/WebsocketListener';
import InformationPopUp from '../features/pop-up-windows/information-pop-up/InformationPopUp';
import MusicPlayer from '../singletons/music-player/MusicPlayer';
import ConnectedState from '../singletons/connected-state/ConnectedState';
import AccountController from '../../../api/AccountController';
import ApplicationLoaderAnimation from '../shared/animations/application-loader-animation/ApplicationLoaderAnimation';
import './css/fonts.css';
import './css/colors.css';
import './css/main.css';
import './css/animations.css';
import ChatsState from '../../../state/entities/ChatsState';

export const globalWSContext = createSignalRContext();

const WaitingForConnection = async () => {
    try {
        while (globalWSContext.connection.state === 'Connecting') {
            ApplicationState.SetConnectionState(1);
            await new Promise(resolve => setTimeout(resolve, 2000));
        };
    
        if (globalWSContext.connection.state === 'Disconnected') {
            ApplicationState.SetConnectionState(2);
            
            await globalWSContext.connection.start();
            await WaitingForConnection();
        };
    
        const token = localStorage.getItem('system_access_token');
    
        try {
            await globalWSContext.invoke('JoinToDirects', token);
            await globalWSContext.invoke('JoinToGroups', token);
            await globalWSContext.invoke('JoinToCollections', token);
        } catch(error) {
            console.error(error);
    
            await new Promise(resolve => setTimeout(resolve, 5000));
            await WaitingForConnection();
        };
    
        ApplicationState.SetConnectionState(0);
    } catch (error) {
        console.log(error);
    };
};

const Layout = observer(() => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isErrorExist, setErrorExistingState] = useState(false);
    const [errorTitle, setErrorTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    let navigate = useNavigate();

    globalWSContext.useSignalREffect("CreateCollection", WebsocketListener.CreateCollectionListener);
    globalWSContext.useSignalREffect("RenameCollection", WebsocketListener.RenameCollectionListener); 
    globalWSContext.useSignalREffect("DeleteCollection", WebsocketListener.RemoveCollectionListener);
    globalWSContext.useSignalREffect("UploadFile", WebsocketListener.UploadFileListener);
    globalWSContext.useSignalREffect("RenameFile", WebsocketListener.RenameFileListener); 
    globalWSContext.useSignalREffect("DeleteFile", WebsocketListener.DeleteFileListener);
    globalWSContext.useSignalREffect("UpdateOccupiedSpace", WebsocketListener.UpdateOccupiedSpaceListner);
    globalWSContext.useSignalREffect("AddToAlbum", WebsocketListener.AddToAlbumListner);
    globalWSContext.useSignalREffect("Create", WebsocketListener.CreateAlbumListner);
    globalWSContext.useSignalREffect("Update", WebsocketListener.UpdateAlbumListner);
    globalWSContext.useSignalREffect("Upload", WebsocketListener.UploadFileListener);
    globalWSContext.useSignalREffect("DeleteAlbum", WebsocketListener.DeleteAlbumListner);
    globalWSContext.useSignalREffect("AddComment", WebsocketListener.AddCommentListner);
    globalWSContext.useSignalREffect("DeleteComment", WebsocketListener.DeleteAlbumListner);
    globalWSContext.useSignalREffect("GetChats", WebsocketListener.GetChatsListner);
    globalWSContext.useSignalREffect("ReceiveMessage", (data) => WebsocketListener.ReceiveMessageListner(data, navigate));
    globalWSContext.useSignalREffect("NewDirectHandler", WebsocketListener.NewConnectionListner);
    globalWSContext.useSignalREffect("AcceptDirect", WebsocketListener.AcceptDirect);
    globalWSContext.useSignalREffect("DeleteMessage", WebsocketListener.DeleteMessageListener);
    globalWSContext.useSignalREffect("HandlePinnedStateChanges", WebsocketListener.PinnedStateChangesListener);
    globalWSContext.useSignalREffect("ViewMessage", WebsocketListener.ViewMessageListner);
    globalWSContext.useSignalREffect("DeleteDirect", WebsocketListener.DeleteDirectListner);
    globalWSContext.useSignalREffect("AddMember", ChatsState.addGroupMember);
    globalWSContext.useSignalREffect("RemoveMember", ChatsState.removeGroupMember);
    globalWSContext.useSignalREffect("ConnetToGroup", WebsocketListener.ConnectToGroupListner);

    useEffect(() => {
        WaitingForConnection()
    }, [globalWSContext?.connection]);

    useEffect(() => {
        const fetchAccount = async () => {
            AccountState.SetLoadingState(true);

            await AccountController.GetAccountData(
                AccountState.GetUserOnSuccessCallback,
                AccountState.GetUserOnFailureCallback,
            );
        };

        if (!!AccountState.account === false) {
            fetchAccount();
        };
    }, [AccountState.account]);

    useLayoutEffect(() => {
        if (AccountState.isAuthorize === false && AccountState.isLoading === false) {
            navigate('/main');
        };
    }, [AccountState.isAuthorize, AccountState.isLoading]);
    
    useEffect(() => {
        const isErrorNotExist = isErrorExist === false;
        const isApplicationHasErrors = ApplicationState.GetCountErrors() > 0;

        if (isErrorNotExist && isApplicationHasErrors) {
            const [title, message] = ApplicationState.GetErrorFromQueue();

            setErrorTitle(title);
            setErrorMessage(message);
            setErrorExistingState(true);

            ApplicationState.RemoveErrorFromQueue();
        };
    }, [isErrorExist, ApplicationState.errorQueue, ApplicationState.errorQueue.length]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <globalWSContext.Provider url={process.env.REACT_APP_SERVER_URL + '/global-hub'}>
            {AccountState.isAuthorize === false ?
                <ApplicationLoaderAnimation />
            :
                <div className='cloud-wrapper' style={{'--disconnected-height': ApplicationState.connectionState === 0 ? '0px' : '15px'}}>
                    <title>Instend</title>
                    <MusicPlayer />
                    {ApplicationState.connectionState !== 0 && <ConnectedState />}
                    {windowWidth > 700 ? <Desktop /> : <Mobile />}
                    <InformationPopUp
                        open={isErrorExist}
                        close={() => setErrorExistingState(false)}
                        title={errorTitle}
                        message={errorMessage}
                    />
                </div>}
        </globalWSContext.Provider>
    );
});

export default Layout;