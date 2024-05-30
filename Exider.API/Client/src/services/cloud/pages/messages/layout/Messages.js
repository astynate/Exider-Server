import React, { useEffect, useState } from 'react';
import Content from '../widgets/content/Content';
import Chat from '../widgets/chat/Chat';
import styles from './main.module.css';
import cyraAvatar from './images/cyra.png';
import { observer } from 'mobx-react-lite';
import Chats from '../widgets/chats/Chats';
import chatsState from '../../../../../states/chats-state';
import { useParams } from 'react-router-dom';

const Messages = observer((props) => {
  const params = useParams();
  const [chat, setChat] = useState(null);

  useEffect(() => {
    if (props.setPanelState) {
        props.setPanelState(true);
    }
  }, [props.setPanelState]);

  useEffect(() => { 
    setChat(chatsState.chats.find(element => element.id === params.id));
  }, [chatsState.chats, params, params.id])
  
  return (
    <Content>
      <Chats />
      {chat ? 
        <Chat 
          chat={chat}
          placeholder={
            <div className={styles.placeholder}>
              <h1>No messages sended</h1>
              <span>Send message to start communicate</span>
            </div>
          }
        />
      :
        <div className={styles.placeholder}>
          <h1>No chat selected</h1>
          <span>Select chat or create</span>
        </div>
      }
    </Content>
  )
});

export default Messages;