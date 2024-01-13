import React from 'react';
import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: 'f92ddb05-b75c-4459-910f-73c58d75f5f5',
    authority: 'https://login.microsoftonline.com/b4d34e42-79a6-478e-b3af-12ce7311fa09',
    redirectUri: 'https://oauth.pstmn.io/v1/browser-callback', // Redirect URI configured in Azure AD
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose,
    },
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

const signIn = async () => {
  // Initialize the MSAL instance before calling other MSAL API methods
  await msalInstance.initialize();

  const loginRequest = {
    scopes: ['user.read'],
  };

  try {
    const authResult = await msalInstance.loginPopup(loginRequest);
    console.log('Authentication successful', authResult);
  } catch (error) {
    console.error('Authentication failed', error);
  }
};

function App() {
  return (
    <div>
      <h1>Your React App</h1>
      <button onClick={signIn}>Sign In</button>
    </div>
  );
}

export default App;