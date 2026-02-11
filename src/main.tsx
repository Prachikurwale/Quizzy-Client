import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.tsx'
import LatencyOverlay from './LatencyOverlay';

const GOOGLE_CLIENT_ID='148223671530-0b8cjrfhpl406sjetpm4eo6rljldai2i.apps.googleusercontent.com' ;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
    <LatencyOverlay />
    </GoogleOAuthProvider>
  </React.StrictMode>
)