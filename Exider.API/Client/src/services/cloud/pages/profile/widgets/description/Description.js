import React from 'react';
import styles from './styles/main.module.css';
import Avatar from '../../shared/avatar/Avatar';
import Username from '../../shared/username/Username';
import Data from '../../shared/data/Data';
import Navigation from '../navigation/Navigation';
import { observer } from 'mobx-react-lite';
import userState from '../../../../../../states/user-state';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Description = observer(() => {

  const { user } = userState;
  const { t } = useTranslation();

  return (

    <>
      <div className={styles.description}>
        <Avatar src={`data:image/png;base64,${user.avatar}`} />
        <div className={styles.profileDescription}>
          <Username username={user.nickname} />
          <Data coins={user.balance} friends={user.friendCount} space={user.storageSpace / 1024} />
          <div><h3 className={styles.name}>{user.name} {user.surname}</h3></div>
        </div>
        <div className={styles.editProfile}>
          <div>
            <div className={styles.navButton}>
              <NavLink to='/settings/profile' className={styles.editProfileButton}>
                {t('cloud.profile.edit_profile')}
              </NavLink>
            </div>
          </div>
        </div>
      </div>
      <Navigation />
    </>

  )

});

export default Description;