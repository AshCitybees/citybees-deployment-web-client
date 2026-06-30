import React, { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import UATApprovalScreen from './screens/UATApprovalScreen.jsx';
import WACProdSyncScreen from './screens/WACProdSyncScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import RunHistoryScreen from './screens/RunHistoryScreen.jsx';
import DeploymentsScreen from './screens/DeploymentsScreen.jsx';
import UsersAppsScreen from './screens/UsersAppsScreen.jsx';
import BackupScreen from './screens/BackupScreen.jsx';

export default function App() {
  const [screen, setScreen] = useState('home');

  return (
    <div className="app-shell">
      <Sidebar current={screen} onNavigate={setScreen} />
      <main className="main-content">
        {screen === 'home'    && <HomeScreen onNavigate={setScreen} />}
        {screen === 'uat'     && <UATApprovalScreen onBack={() => setScreen('home')} />}
        {screen === 'wac'     && <WACProdSyncScreen onBack={() => setScreen('home')} />}
        {screen === 'deployments' && <DeploymentsScreen />}
        {screen === 'usersapps' && <UsersAppsScreen />}
        {screen === 'backups' && <BackupScreen />}
        {screen === 'settings'&& <SettingsScreen    onBack={() => setScreen('home')} />}
        {screen === 'history' && <RunHistoryScreen  onBack={() => setScreen('home')} />}
      </main>
    </div>
  );
}
