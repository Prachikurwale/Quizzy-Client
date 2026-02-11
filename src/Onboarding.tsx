import React, { useState } from 'react';
interface OnboardingProps {
  explorerName: string;
  onComplete: (details: any) => void;
}
export default function Onboarding({ explorerName, onComplete }: OnboardingProps) {
  const [formData, setFormData] = useState({
    parentFirstName: '',
    parentLastName: '',
    childName: '',
    dob: '',
    gender: '',
    language: 'English',
    phone: ''
  });

 
 

const [showQuizzyIntro, setShowQuizzyIntro] = useState(false);

const saveToDb = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/save-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: explorerName, 
          details: formData 
        })
      });

if (response.ok) {
        setShowQuizzyIntro(true);  
      } else {
        alert("Failed to save. Please try again!");
      }
    } catch (err) {
      console.error("Connection error:", err);
      alert("Cannot connect to server!");
    }
  };
 

  




  if (showQuizzyIntro) {
    return (
      <div style={containerStyle}>
        
        <div style={cardStyle}>

              <h2 style={{ 
  color: '#ff0048', 
  fontFamily: "'Samarkan', cursive",  
  fontSize: '2.5rem',                
  letterSpacing: '1px' 
}}>
  Quizzy
</h2>
        <img 
  src="/cute.jpg" 
  alt="Quizzy" 
  style={{
    width: "150px",
    height: "150px",      
    borderRadius: "50%",  
    objectFit: "cover",   
    border: "4px solid #ff8fab" 
  }} 
/>
         
          <p style={{ fontSize: '1.2rem', margin: '20px 0' ,color:'#ffffff' }}>
            Let’s introduce <strong style={{color:'black'}}>{formData.childName}  </strong> to Quizzy!
          </p>
          <p style={{ color: '#555', fontStyle: 'italic' }}>
            "Give the phone to your child to talk to Quizzy."
          </p>
          <button 
            onClick={() => onComplete(formData)} 
            style={buttonStyle}
          >
            Start Conversation 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>

     <div className="floating-shape" style={{ top: '4%', left: '50%', fontSize: '3rem' }}>🧠  </div>
    <div className="floating-shape" style={{ top: '6%', right: '30%', fontSize: '4rem' }}>💫</div>
    <div className="floating-shape" style={{ bottom: '5%', left: '30%', fontSize: '2.3rem' }}>🎲</div>
    <div className="floating-shape" style={{ bottom: '3%', left: '50%', fontSize: '2.5rem' }}>🎯</div>
    <div className="floating-shape" style={{ top: '45%', left: '50%', fontSize: '2rem' }}>🏆</div>

<div className="floating-shape" style={{ top: '45%', left: '50%', fontSize: '2rem' }}>🦄</div>

      <div className="floating-shape" style={{ top: '6%', left: '10%', fontSize: '3rem' }}>☁️</div>
    <div className="floating-shape" style={{ top: '6%', right: '15%', fontSize: '4rem' }}>☀️</div>
    <div className="floating-shape" style={{ bottom: '15%', left: '20%', fontSize: '2.3rem' }}>🎨</div>
    <div className="floating-shape" style={{ bottom: '10%', left: '10%', fontSize: '2.5rem' }}>⭐</div>
    <div className="floating-shape" style={{ top: '45%', left: '50%', fontSize: '2rem' }}>🎈</div>

      <div className="floating-shape" style={{ top: '8%', left: '30%', fontSize: '3rem' }}>🌈</div>
    <div className="floating-shape" style={{ top: '20%', left: '15%', fontSize: '4rem' }}>🧩</div>
    <div className="floating-shape" style={{ bottom: '45%', left: '20%', fontSize: '3rem' }}>📚</div>
    <div className="floating-shape" style={{ bottom: '60%', right: '20%', fontSize: '2.5rem' }} >🦋</div>
    <div className="floating-shape" style={{ top: '30%', left: '3%', fontSize: '2rem' }}>📖</div>
  
 
 <div className="floating-shape" style={{ top: '10%', right: '7%', fontSize: '3rem' }}>🌈</div>
  <div className="floating-shape" style={{ top: '48%', left: '8%', fontSize: '4rem' }}>🦋</div>
  
 
  <div className="floating-shape" style={{ top: '50%', right: '20%', fontSize: '2.5rem' }}>🖍️</div>
  <div className="floating-shape" style={{ top: '40%', right: '4%', fontSize: '3rem' }}>🧩</div>

  
  <div className="floating-shape" style={{ bottom: '20%', right: '10%', fontSize: '3rem' }}>📚</div>
  <div className="floating-shape" style={{ bottom: '5%', right: '15%', fontSize: '2rem' }}>🎨</div>
  <div className="floating-shape" style={{ bottom: '25%', left: '68%', fontSize: '3rem' }}>⭐</div>

      <div style={{...cardStyle, width: '450px', position: 'relative', zIndex: 1}}>
        <h2 style={{ color: '#FF4500', fontFamily:" 'Fredoka', cursive, sans-serif"}}>Introduce you & your little learner</h2>
        <form onSubmit={saveToDb} style={formStyle}>
          <div style={rowStyle}>
            <input placeholder="Parent's First Name" required style={inputStyle} onChange={e => setFormData({...formData, parentFirstName: e.target.value})} />
            <input placeholder="Parent's Last Name" required style={inputStyle} onChange={e => setFormData({...formData, parentLastName: e.target.value})} />
          </div>
          <input placeholder="Child's Name" required style={inputStyle} onChange={e => setFormData({...formData, childName: e.target.value})} />
          <div style={rowStyle}>
            <input type="date" placeholder="DOB" required style={inputStyle} onChange={e => setFormData({...formData, dob: e.target.value})} />
            <select style={inputStyle} onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
             
            </select>
          </div>
          <div style={rowStyle}>
            <select style={inputStyle} onChange={e => setFormData({...formData, language: e.target.value})}>
              <option value="English">English</option>
              <option value="Hindi"> English & Hindi  </option>
              
            </select>
           <input 
  placeholder="Phone Number" 
  type="tel" 
  maxLength={10}
  style={inputStyle} 
  onChange={e => {
   
    const val = e.target.value.replace(/\D/g, ""); 
    setFormData({...formData, phone: val});
  }} 
  value={formData.phone}
/>
          </div>
          <button type="submit" style={buttonStyle}>Save Details  </button>
        </form>
      </div>
    </div>
  );
}

  const containerStyle: React.CSSProperties = { height: '100vh', 
  width: "100vw", 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  overflow: "hidden",
  background: '#d1dbe4', 
  padding: '20px',
  position: 'fixed',   
  top: 0,
  left: 0,
  touchAction: 'none'};
const cardStyle: React.CSSProperties = { background: '#a3b7ca', 
  padding: '30px', 
  borderRadius: '35px', 
  border: '5px solid #FF8fab', 
  textAlign: 'center',
  boxShadow: '0 10px 0px #f97697',};
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };
const rowStyle: React.CSSProperties = { display: 'flex', gap: '10px' };
const inputStyle: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '15px', border: '1.4px solid #62838b' , backgroundColor :'#d1dbe4' , color:'#23012c'};
const buttonStyle: React.CSSProperties = {background: '#63838b', 
  color: 'white', 
  padding: '15px 35px', 
  borderRadius: '50px', 
  border: 'none', 
  cursor: 'pointer', 
  fontWeight: 'bold', 
  marginTop: '15px',
  fontSize: '1.2rem',
  boxShadow: '0 6px 0px #425e65', 
  fontFamily:"'Fredoka', cursive, sans-serif",
  transition: 'transform 0.1s' };


 


 