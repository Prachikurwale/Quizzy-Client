 import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

export default function Login({ onLoginSuccess }: { onLoginSuccess: (data: any) => void }) {
  
  const handleSuccess = async (googleResponse: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleResponse.credential })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('dora_token', data.token);
        onLoginSuccess(data);  
      } else {
        alert("Login failed!");
      }
    } catch (err) {
      alert("Check if server is running!");
    }
  };

 return (
    <div style={containerStyle}>
      <div style={cardStyle}>
       <h2 style={{ 
  color: '#FF4500', 
  fontFamily: "'Samarkan', cursive", 
  fontSize: '2.5rem',              
  
  letterSpacing: '1px' 
}}>
  Quizzy
</h2>
        <div style={imageContainerStyle}>
          <img 
            src="/cute.jpg" 
            alt="Quizzy" 
            style={quizzyImageStyle} 
          />
        </div>

        <h2 style={{ color: '#FF4500', margin: '10px 0' }}>Explorer Entrance</h2>
        <p style={{ color: '#575656', marginBottom: '20px' }}>Sign in to start your adventure</p>
        
        <div style={{ display: 'flex', justifyContent: 'center'  , border:'#ff8fab'}}>
          <GoogleLogin    
            onSuccess={handleSuccess} 
            onError={() => alert("Google Login Failed")} 
          />
        </div>
      </div>
    </div>
  );
}

 
const containerStyle: React.CSSProperties = { 
  height: '100vh',
  display: 'flex',
  justifyContent: 'center', 
  alignItems: 'center', 
  background: '#E0F7FA'   ,      
  width: "100vw",        
 
  };
const cardStyle: React.CSSProperties = { 
  background: 'white', 
  padding: '40px', 
  borderRadius: '30px', 
  border: '5px solid #ff8fab', 
  textAlign: 'center', 
  width: '320px' 
};


const imageContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '20px'
};

const quizzyImageStyle: React.CSSProperties = {
  width: '120px',
  height: '120px',
  borderRadius: '50%',  
  border: '4px solid #ff8fab',  
  objectFit: 'cover',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
};