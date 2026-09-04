import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import SecurityGatewayBanner from './components/SecurityGatewayBanner';

import LandingScreen from './pages/LandingScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import AuthScreen from './pages/AuthScreen';
import HomeScreen from './pages/HomeScreen';
import ScannerScreen from './pages/ScannerScreen';
import SecurityResultScreen from './pages/SecurityResultScreen';
import AssistantScreen from './pages/AssistantScreen';
import ReportsScreen from './pages/ReportsScreen';
import FamilyScreen from './pages/FamilyScreen';
import PermissionsScreen from './pages/PermissionsScreen';
import AdminDashboard from './pages/AdminDashboard';
import AdminAuthScreen from './pages/AdminAuthScreen';
import FirstTimeSetupScreen from './pages/FirstTimeSetupScreen';
import LinkProtectionOverlay from './components/LinkProtectionOverlay';

import { API_BASE_URL, safeApiCall } from './config/apiConfig';
import { bindDeviceToAccount } from './utils/deviceInfo';
import './styles/glassmorphism.css';

const INITIAL_HISTORY = [
  {
    id: 'CB-2026-00912',
    type: 'URL',
    target: 'paypa1-account-security-update.xyz/login.php',
    riskScore: 92,
    status: 'DANGEROUS',
    title: 'High Risk Phishing / Malicious Site Detected',
    recommendation: 'DO NOT OPEN or enter any credentials on this site. Block sender.',
    timestamp: '10 mins ago',
    findings: [
      { type: 'DANGER', title: 'Suspected PAYPAL Brand Impersonation', desc: 'Domain paypa1-account-security-update.xyz is not an official PayPal site.' },
      { type: 'DANGER', title: 'High-Risk Domain Extension (.xyz)', desc: 'Frequently associated with bulk phishing campaigns.' }
    ]
  },
  {
    id: 'CB-2026-00911',
    type: 'APK',
    target: 'Free_Netflix_Premium_v4.2.apk',
    riskScore: 88,
    status: 'DANGEROUS',
    packageName: 'com.free.netflix.hacked.mod',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    title: 'Trojan / Malicious APK Mod',
    recommendation: 'DO NOT install. Delete file immediately from downloads.',
    timestamp: '1 hour ago',
    findings: [
      { type: 'DANGER', title: 'Dangerous Permission: SEND_SMS', desc: 'Can send background premium SMS messages without user consent.' },
      { type: 'DANGER', title: 'Overlay Permission: SYSTEM_ALERT_WINDOW', desc: 'Can draw overlay screens over banking apps to harvest PIN numbers.' }
    ]
  }
];

const INITIAL_FAMILY_ALERTS = [
  {
    id: 'ALERT-001',
    deviceName: 'Grandma\'s Galaxy A34',
    threatType: 'DANGEROUS_APK',
    riskScore: 94,
    target: 'Free_Bingo_Jackpot_Mod.apk',
    timestamp: '15 mins ago'
  }
];

export default function App() {
  // Light Theme Default as requested
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null); // { name, email, role, accessToken }
  const [onboarded, setOnboarded] = useState(false);
  
  const [activeTab, setActiveTab] = useState('landing'); 
  const [scannerType, setScannerType] = useState('url');
  const [currentScanResult, setCurrentScanResult] = useState(null);
  const [assistantQuery, setAssistantQuery] = useState('');

  // Intercepted / Shared Link State
  const [targetSharedUrl, setTargetSharedUrl] = useState(null);
  
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [familyAlerts, setFamilyAlerts] = useState(INITIAL_FAMILY_ALERTS);

  // Gateway Notification & User Control Settings
  const [gatewayNotification, setGatewayNotification] = useState(null);
  const [userSettings, setUserSettings] = useState({
    securityMode: 'BALANCED', // BALANCED | STRICT | QUICK
    showSafeNotifications: true,
    autoContinueLowRisk: true,
    securityAnimations: true
  });

  // Apply default theme & restore persistent session / incoming share intents
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    // Check for shared URL query parameters (e.g. ?url=https://...)
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('url') || params.get('link') || params.get('text');
    if (shared && (shared.startsWith('http://') || shared.startsWith('https://'))) {
      setTargetSharedUrl(shared);
    }

    // Check stored user session
    const storedToken = localStorage.getItem('cypherbuddy_token');
    const isSetupDone = localStorage.getItem('cypherbuddy_setup_completed') === 'true';

    if (storedToken) {
      setUser({ role: 'USER' });
      bindDeviceToAccount();
      if (!isSetupDone) {
        setActiveTab('setup');
      } else {
        setActiveTab('home');
      }
    }
  }, []);

  // Handle Onboarding finish
  const handleOnboardingComplete = () => {
    setOnboarded(true);
    setActiveTab('auth');
  };

  // Handle Auth Login/Register success
  const handleAuthSuccess = (authData) => {
    setUser(authData.user);
    bindDeviceToAccount();
    const isSetupDone = localStorage.getItem('cypherbuddy_setup_completed') === 'true';
    if (!isSetupDone) {
      setActiveTab('setup');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cypherbuddy_token');
    setActiveTab('landing');
  };

  const handleScanComplete = (result) => {
    setCurrentScanResult(result);
    setHistory(prev => [result, ...prev]);
    setActiveTab('result');
  };

  const handleTriggerGatewayNotification = (result) => {
    setGatewayNotification(result);
    setHistory(prev => [result, ...prev]);
  };

  const handleUpdateSettings = (newSettings) => {
    setUserSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleSendFamilyAlert = (result) => {
    const newAlert = {
      id: `ALERT-${Date.now().toString().slice(-4)}`,
      deviceName: 'Linked Family Member',
      threatType: result.type,
      riskScore: result.riskScore,
      target: result.target,
      timestamp: 'Just now'
    };
    setFamilyAlerts(prev => [newAlert, ...prev]);
    alert('🚨 High-risk security threat broadcasted to linked family safety devices!');
    setActiveTab('family');
  };

  return (
    <div className="app-viewport-wrapper">
      
      {/* Link Protection Intercept Overlay (Section 9, 11, 12, 13, 14, 25) */}
      {targetSharedUrl && (
        <LinkProtectionOverlay 
          targetUrl={targetSharedUrl}
          onClose={() => setTargetSharedUrl(null)}
          onViewReport={(item) => {
            setCurrentScanResult(item);
            setTargetSharedUrl(null);
            setActiveTab('result');
          }}
        />
      )}

      {/* Global Background Security Gateway Notification Banner */}
      <SecurityGatewayBanner 
        notification={gatewayNotification}
        userSettings={userSettings}
        onDismiss={() => setGatewayNotification(null)}
        onViewReport={(item) => {
          setCurrentScanResult(item);
          setGatewayNotification(null);
          setActiveTab('result');
        }}
        onContinueAction={(item) => {
          // Action continued silently where safe
        }}
      />

      {/* Outer Adaptive Responsive Container */}
      <div className="device-frame-adaptive">
        
        {/* App Header */}
        <Header 
          theme={theme}
          setTheme={setTheme}
          user={user}
          onLogout={handleLogout}
          familyAlertCount={familyAlerts.length}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Dynamic View Area */}
        <main style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          
          {/* VIEW: LANDING PAGE */}
          {activeTab === 'landing' && (
            <LandingScreen
              onGetStarted={() => setActiveTab(onboarded ? 'auth' : 'onboarding')}
              onLearnMore={() => setActiveTab('onboarding')}
            />
          )}

          {/* VIEW: ONBOARDING */}
          {activeTab === 'onboarding' && (
            <OnboardingScreen
              onComplete={handleOnboardingComplete}
            />
          )}

          {/* VIEW: AUTHENTICATION (LOGIN / REGISTER) */}
          {activeTab === 'auth' && (
            <AuthScreen
              onAuthSuccess={handleAuthSuccess}
              onBackToLanding={() => setActiveTab('landing')}
            />
          )}

          {/* VIEW: FIRST-TIME DEVICE & PERMISSION SETUP WIZARD (Section 1 & 3) */}
          {activeTab === 'setup' && (
            <FirstTimeSetupScreen 
              onCompleteSetup={() => setActiveTab('home')}
            />
          )}

          {/* VIEW: HOME DASHBOARD */}
          {activeTab === 'home' && (
            <HomeScreen
              setActiveTab={setActiveTab}
              setScannerType={setScannerType}
              history={history}
              onSelectScanItem={(item) => {
                setCurrentScanResult(item);
                setActiveTab('result');
              }}
              onSelectTroubleshoot={(q) => {
                setAssistantQuery(q);
                setActiveTab('assistant');
              }}
              onTriggerGatewayNotification={handleTriggerGatewayNotification}
            />
          )}

          {/* VIEW: SCANNER */}
          {activeTab === 'scan' && (
            <ScannerScreen
              initialType={scannerType}
              onScanComplete={handleScanComplete}
            />
          )}

          {/* VIEW: SECURITY RESULT */}
          {activeTab === 'result' && (
            <SecurityResultScreen
              result={currentScanResult || history[0]}
              onBack={() => setActiveTab('scan')}
              onSendFamilyAlert={handleSendFamilyAlert}
            />
          )}

          {/* VIEW: ASSISTANT */}
          {activeTab === 'assistant' && (
            <AssistantScreen
              initialQuery={assistantQuery}
            />
          )}

          {/* VIEW: REPORTS & HISTORY */}
          {activeTab === 'reports' && (
            <ReportsScreen
              history={history}
              onSelectReport={(item) => {
                setCurrentScanResult(item);
                setActiveTab('result');
              }}
            />
          )}

          {/* VIEW: FAMILY SAFETY */}
          {activeTab === 'family' && (
            <FamilyScreen
              alerts={familyAlerts}
              onClearAlert={(i) => setFamilyAlerts(familyAlerts.filter((_, idx) => idx !== i))}
            />
          )}

          {/* VIEW: PERMISSIONS & SETTINGS */}
          {activeTab === 'permissions' && (
            <PermissionsScreen 
              userSettings={userSettings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {/* VIEW: ADMIN DASHBOARD (2-STEP OTP PROTECTED) */}
          {activeTab === 'admin' && (
            user?.role === 'ADMIN' ? (
              <AdminDashboard
                history={history}
                apiBaseUrl={API_BASE_URL}
              />
            ) : (
              <AdminAuthScreen
                apiBaseUrl={API_BASE_URL}
                onAdminAuthSuccess={(authData) => {
                  setUser(authData.user);
                }}
              />
            )
          )}


        </main>

        {/* Bottom Navigation Bar */}
        {activeTab !== 'landing' && activeTab !== 'onboarding' && activeTab !== 'auth' && activeTab !== 'setup' && (
          <Navigation 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

      </div>

    </div>
  );
}
