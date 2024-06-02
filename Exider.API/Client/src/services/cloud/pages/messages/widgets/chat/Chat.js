import React, { useEffect, useRef, useState } from 'react';
import styles from './main.module.css';
import info from './images/header/info.png';
import Input from '../../shared/input/Input';
import chatsState from '../../../../../../states/chats-state';
import { observer } from 'mobx-react-lite';
import { messageWSContext } from '../../../../layout/Layout';
import applicationState from '../../../../../../states/application-state';
import { useParams } from 'react-router-dom';
import Message from '../../shared/message/Message';
import userState from '../../../../../../states/user-state';
import Loader from '../../../../shared/loader/Loader';
import { ConvertDate, IsDayDiffrent } from '../../../../../../utils/DateHandler';
import ChatInformation from '../../features/ChatInformation';
import back from './images/header/arrow.png';

export const ChangeAccessStateAsync = async (id, isAccept) => {
    try {
        while (messageWSContext.connection.state !== 'Connected') {
            if (messageWSContext.connection.state === 'Disconnected') {
                await messageWSContext.connection.start();
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await messageWSContext.connection.invoke("ChangeAccessState", id, localStorage.getItem("system_access_token"), isAccept);
    } catch (error) {
        console.error('Failed to connect or join:', error);
    }
};

const Chat = observer(({isMobile, isOpen, close, chat, placeholder, requestSended}) => {
    const params = useParams();
    const scrollRef = useRef();
    const scrollElement = useRef();
    const { user } = userState;
    const [isHasMore, setHaseMoreState] = useState(true);
    const [open, setOpenState] = useState(false);

    const [isAvailable, setAvailbleState] = useState(!((chatsState.draft && chatsState.draft.messages && 
        chatsState.draft.messages.length > 0) || chat && !chat.isAccepted));

    useEffect(() => {
        setAvailbleState(!((chatsState.draft && chatsState.draft.messages && 
            chatsState.draft.messages.length > 0) || chat && !chat.isAccepted));
    }, [isAvailable, chatsState, chatsState.chats, chat, chat?.isAccepted]);

    useEffect(() => {
        if (params.id) {
            chatsState.setDraft(null);
        }
    }, [params]);

    useEffect(() => {
        if (scrollElement.current) {
            const element = scrollElement.current;
            element.scrollTo(0, element.scrollHeight);
        }
    }, [scrollElement, scrollElement.current, scrollElement.current?.scrollHeight, chat?.messages, chat?.messages?.length]);

    const HandleScroll = async () => {
        if (scrollRef && scrollRef.current && isHasMore === true) {
            const offsetTop = scrollRef.current.getBoundingClientRect().top;

            while (offsetTop > 0 && chat.hasMore === true) {
                setHaseMoreState(false);
                await chatsState.GetMessages(params.id);
            }

            setHaseMoreState(true);
        }
    }

    useEffect(() => {
        HandleScroll();
    }, []);

    if (isMobile === true && isOpen === false) {
        return null;
    } else {
        return (
            <div 
                className={styles.chat} 
                onScroll={HandleScroll} 
                ref={scrollElement}
                id={isMobile ? 'mobile' : null}
            >
                {chat && chat.name && chat.avatar && <ChatInformation 
                    open={open}
                    name={chat.name}
                    avatar={chat.avatar}
                    close={() => setOpenState(false)}
                    title="Chat information"
                    profileAddition={
                        <span>0 Friends 0 Friends 0 Friends</span>
                    }
                />}
                <div className={styles.header}>
                    <div className={styles.left} onClick={() => setOpenState(true)}>
                        {isMobile && 
                            <img 
                                src={back} 
                                className={styles.back} 
                                onClick={close}
                            />}
                        <div className={styles.avatar}>
                            <img 
                                src={`data:image/png;base64,${chatsState.draft ? chatsState.draft.avatar : chat.avatar}`}
                                className={styles.avatarImage} 
                                draggable="false"
                            />
                        </div>
                        <div className={styles.information}>
                            <span className={styles.name}>{chatsState.draft ? chatsState.draft.nickname : chat.name}</span>
                            <span className={styles.data}>last seen recently</span>
                        </div>
                    </div>
                    <div className={styles.right}>
                        <img src={info} 
                            className={styles.buttonImage} 
                            draggable="false"
                            onClick={() => setOpenState(true)}
                        />
                    </div>
                </div>
                {chatsState.draft ? 
                    <>
                        {chatsState.draft.messages ?
                            <>
                                {chatsState.draft.isLoaded ?
                                    (requestSended)
                                :
                                    <div className={styles.loder}>
                                        <div className={styles.sendingText}>
                                            <h1>Sending Invite</h1>
                                            <span>Wait a minute</span>
                                        </div>
                                        <Loader />
                                    </div>}
                                <div className={styles.messages}>
                                    {chatsState.draft.messages.map((element, index) => {
                                            if (user && user.avatar) {
                                                return (
                                                    <Message
                                                        key={index}
                                                        name={null}
                                                        text={element.Text}
                                                        avatar={userState.user.avatar}
                                                        type={'My'}
                                                        position={3}
                                                        time={element.Date}
                                                    />
                                            );
                                        } else {
                                            return null;
                                        }
                                    })}
                                </div>
                            </>
                        :
                            (placeholder)
                        }
                    </>
                : (
                    <>
                        {isAvailable === false && user.id === chat.ownerId && (requestSended)}
                        {isAvailable === false && user.id !== chat.ownerId && 
                            <div className={styles.textInfo}>
                                <h1>Request for a chat</h1>
                                <span>If you accept, {chat && chat.name ? chat.name : null} can send you messages otherwise the chat will be deleted</span>
                            </div>
                        }
                        <div className={styles.messages}>
                            <div ref={scrollRef}></div>
                            {chat.messages.map((element, index) => {
                                let avatar = null;
                                let position = 3;
    
                                if (element.UserId === user.id) {
                                    avatar = user.avatar;
                                } else {
                                    avatar = chatsState.users.find(user => user.Id === element.UserId);
                                    
                                    if (avatar) {
                                        avatar = avatar.Avatar;
                                    }
                                }
    
                                if (avatar) {
                                    const prevMessage = chat.messages[index - 1];
                                    const nextMessage = chat.messages[index + 1];
    
                                    if (prevMessage && nextMessage && prevMessage.UserId === element.UserId && nextMessage.UserId === element.UserId) {
                                        if (nextMessage && nextMessage.Date && element && element.Date && IsDayDiffrent(nextMessage.Date, element.Date) === true) {
                                            position = 2;
                                        } else {
                                            if (prevMessage && prevMessage.Date && element && element.Date && IsDayDiffrent(prevMessage.Date, element.Date) === true) {
                                                position = 0;
                                            } else {
                                                position = 1;
                                            }
                                        }
                                    } else if (prevMessage && prevMessage.UserId === element.UserId) {
                                        position = 2;
                                    } else if (nextMessage && nextMessage.UserId === element.UserId) {
                                        if (nextMessage && nextMessage.Date && element && element.Date && IsDayDiffrent(nextMessage.Date, element.Date) === true) {
                                            position = 3;
                                        } else {
                                            position = 0;
                                        }
                                    }
    
                                    let date = null;
    
                                    if (prevMessage && prevMessage.Date && element && element.Date) {
                                        date = IsDayDiffrent(prevMessage.Date, element.Date) === true ? ConvertDate(element.Date) : null;
                                    } else if (element && element.Date) {
                                        date = ConvertDate(element.Date);
                                    }
    
                                    return (
                                        <div key={element.Id}>
                                            {date && <div className={styles.date}>
                                                <span>{date}</span>
                                            </div>}
                                            <Message
                                                name={null}
                                                text={element.Text}
                                                avatar={avatar}
                                                type={element.UserId === user.id ? 'My' : 'Other'}
                                                position={position}
                                                time={element.Date}
                                            /> 
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </>
                )}
                <div className={styles.input}>
                    {isAvailable === false ?
                        user.id === chat.ownerId ?
                            <div className={styles.inputPlaceholder}>
                                <span>You can't send messages</span>
                            </div>
                        :
                            <div className={styles.inputPlaceholder}>
                                <div className={styles.accept} onClick={() => ChangeAccessStateAsync(chat.directId, true)}>Accept</div>
                                <div className={styles.reject} onClick={() => ChangeAccessStateAsync(chat.directId, false)}>Reject</div>
                            </div>
                    :
                        <Input 
                            sendMessage={(message) => {
                                if (message === '' || !message) {
                                    return;
                                }
    
                                if (params.id) {
                                    try {
                                        messageWSContext.connection.invoke("SendMessage", {
                                            id: params.id,
                                            text: message,
                                            userId: localStorage.getItem("system_access_token"),
                                            type: 0
                                        });
                                    } catch {
                                        applicationState.AddErrorInQueue('Attention!', 'Something went wrong');
                                    }
                                } else if (chatsState.draft) {
                                    const messageModel = {
                                        Text: message,
                                        UserId: localStorage.getItem("system_access_token"),
                                        Date: new Date()
                                    }
    
                                    chatsState.SetDraftMessage(
                                        messageWSContext.connection.invoke("SendMessage", {
                                            id: chatsState.draft.id,
                                            text: message,
                                            userId: localStorage.getItem("system_access_token"),
                                            type: 0
                                        }),
                                        messageModel);
                                }
                            }}
                        />
                    }
                </div>
            </div>
        );
    }
});

export default Chat;