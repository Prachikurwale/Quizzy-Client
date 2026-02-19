import { useEffect, useState, useRef } from "react";
import { STTLogic, TTSLogic, sharedAudioPlayer } from "speech-to-speech";
import OpenAI from "openai";
import Login from "./Login"; 
import Onboarding from "./Onboarding"; 
import { FaSignOutAlt, FaRegComments, FaTrashAlt, FaPaperPlane ,FaCamera } from 'react-icons/fa';
 

const client = new OpenAI({
  baseURL: `${window.location.origin}/api/nvidia`,
  
  apiKey: import.meta.env.VITE_NVIDIA_KEY,
  dangerouslyAllowBrowser: true,
});

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isOnboarded, setIsOnboarded] = useState(false);
  const [explorerName, setExplorerName] = useState("");
  const [status, setStatus] = useState("Loading...");
  const [isReady, setIsReady] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);  
const toggleProfile = () => setIsProfileOpen(!isProfileOpen);  

  const [textInput, setTextInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("quizzy_history");
    return saved ? JSON.parse(saved) : [{ 
      role: "system", 
      content: "You are Quizzy, a friendly AI detective for kids. When you see an image, identify the object, animal, or toy. Tell the child its color and one fun fact about it. Keep your answers short, magical, and encouraging!" 
    }];
  });

  const historyRef = useRef<any[]>(chatHistory);
  const ttsRef = useRef<any>(null);
  const sttRef = useRef<any>(null);
  const isProcessing = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatOpen]);

   
  useEffect(() => {
    const token = localStorage.getItem("quizzy_token");
    const savedOnboarded = localStorage.getItem("quizzy_onboarded");
    const savedChildName = localStorage.getItem("quizzy_child_name");

    if (token) {
      setIsLoggedIn(false);  ///****//
      if (savedOnboarded === "false") {
        setIsOnboarded(true);
        setExplorerName(savedChildName || "");
      }
    }
  }, []);

  useEffect(() => {
    historyRef.current = chatHistory;
    localStorage.setItem("quizzy_history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (!isLoggedIn || !isOnboarded) return; 

    async function initQuizzy() {
      try {
        sharedAudioPlayer.configure({ autoPlay: true });
        ttsRef.current = new TTSLogic({ voiceId: "en_US-hfc_female-medium" });
        await ttsRef.current.initialize();
        
        sttRef.current = new STTLogic(
          (msg) => console.log(msg),
          async (transcript) => {
            if (transcript.trim().length > 1 && !isProcessing.current) {
              await talkToQuizzy(transcript);
            }
          }
        );
        setIsReady(true);
        setStatus("Ready! Click to start.");
      } catch (err) { 
        setStatus("Error loading voice: " + err); 
      }
    }
    initQuizzy();
    return () => { if (sttRef.current) sttRef.current.stop(); };
  }, [isLoggedIn, isOnboarded]);








 

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setStatus("Quizzy is looking...");

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 512;  
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

       
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

      
      talkToQuizzy("Hey Quizzy! Can you look at this and tell me what it is, what color it has, and a fun thing about it?", compressedBase64);
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};






const talkToQuizzy = async (input: string, imageUrl?: string) => {
  if (isProcessing.current) return;
  isProcessing.current = true;
  if (sttRef.current) sttRef.current.stop();

  setStatus("Thinking...");

  
  const userContent = imageUrl 
    ? [
        { type: "text", text: input },
        { type: "image_url", image_url: { url: imageUrl } }
      ]
    : input;

  const newUserMsg = { role: "user", content: userContent };
  
 
  const apiMessages = historyRef.current.map(msg => {
    if (Array.isArray(msg.content)) {
      
      const textPart = msg.content.find((p: any) => p.type === "text");
      return { role: msg.role, content: textPart ? textPart.text : "" };
    }
    return msg;
  });

   
  apiMessages.push(newUserMsg);

  try {
    const stream = await client.chat.completions.create({
      model: imageUrl ? "meta/llama-3.2-11b-vision-instruct" : "meta/llama-3.1-8b-instruct",
      messages: apiMessages,
      max_tokens: 60,
      stream: true,
    });

    let fullReply = "";
    let sentenceBuffer = "";
    setStatus("Speaking...");

    for await (const chunk of stream) {
       
      const content = chunk.choices[0]?.delta?.content || "";
      if (!content) continue;

      fullReply += content;
      sentenceBuffer += content;

      if (/[.!?]/.test(sentenceBuffer)) {
        const sentenceToSpeak = sentenceBuffer.trim();
        sentenceBuffer = ""; 
        ttsRef.current.synthesize(sentenceToSpeak).then((result: any) => {
          sharedAudioPlayer.addAudioIntoQueue(result.audio, result.sampleRate);
        });
      }
    }

    if (sentenceBuffer.trim()) {
       const result = await ttsRef.current.synthesize(sentenceBuffer.trim());
       sharedAudioPlayer.addAudioIntoQueue(result.audio, result.sampleRate);
    }

    
    const newHistory = [...historyRef.current, newUserMsg, { role: "assistant", content: fullReply }];
    setChatHistory(newHistory);
    historyRef.current = newHistory;
    
    await sharedAudioPlayer.waitForQueueCompletion();
    
    setStatus("Listening...");
    isProcessing.current = false;
    if (sttRef.current) sttRef.current.start();

  } catch (err: any) {
    console.error("Streaming Error:", err);
    
    isProcessing.current = false;
    setStatus("Ready! Click to start.");
    if (sttRef.current) sttRef.current.start();
  }
};






  
  const handleLogout = () => {
    localStorage.removeItem("quizzy_token");
    localStorage.removeItem("quizzy_history");
    
    setIsLoggedIn(false);  
    setIsReady(false);
    window.location.reload(); 
  };

  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem("quizzy_token", userData.token || "dummy_token");
    setIsLoggedIn(true);  

    
    const savedOnboarded = localStorage.getItem("quizzy_onboarded");
    const savedName = localStorage.getItem("quizzy_child_name");

    if (userData.isOnboarded || savedOnboarded === "false") {
      setIsOnboarded(true);/////////////
      setExplorerName(userData.childName || savedName || userData.username);
      localStorage.setItem("quizzy_onboarded", "true");
    } else {
      setExplorerName(userData.username);
    }
  };

  const handleOnboardingComplete = (details: any) => {
    const name = details.childName || details;
    setExplorerName(name);
    setIsOnboarded(true);
    localStorage.setItem("quizzy_onboarded", "true");
    localStorage.setItem("quizzy_child_name", name);
  };

  const clearChat = () => {
    const resetHistory = [{ role: "system", content: "You are Quizzy." }];
    setChatHistory(resetHistory);
    localStorage.setItem("quizzy_history", JSON.stringify(resetHistory));
  };

  const stopConversation = () => {
    try {
      if (sttRef.current) sttRef.current.stop();
      if (ttsRef.current && typeof (ttsRef.current as any).stop === "function") {
        (ttsRef.current as any).stop();
      }
      if ((sharedAudioPlayer as any)?.stop) {
        (sharedAudioPlayer as any).stop();
      }
    } catch (e) {
       
    }
    isProcessing.current = false;
    setStatus("Ready! Click to start.");
  };

  if (!isLoggedIn) return <Login onLoginSuccess={handleLoginSuccess} />;
  if (!isOnboarded) return <Onboarding explorerName={explorerName} onComplete={handleOnboardingComplete} />;


 
  return (
    <div style={styles.container}>
      <div style={styles.navBar}>
 
    <FaRegComments size={50}
    onClick={() => setIsChatOpen(!isChatOpen)} 
  style={{ cursor: "pointer" , color:"#ff8fab"}}
    />
 
 
  

    
  <h2 style={{ 
  color: 'white', 
  fontFamily: "'Samarkan', cursive", 
  fontSize: '2.5rem',             
  letterSpacing: '1px' ,
  margin:"0",
  fontWeight:"bold"
}}>
  Quizzy
</h2>
 
  <div style={styles.navRightGroup}>
   <div onClick={toggleProfile} style={styles.avatarInitial}>
  {explorerName ? explorerName.charAt(0).toUpperCase() : "?"}
</div>
  {isProfileOpen && (
      <div style={styles.profilePopup}>
        <div style={styles.popupContent}>
          <div style={styles.popupAvatar}>
           {explorerName ? explorerName.charAt(0).toUpperCase() : "?"}
         </div>
           <div style={styles.profileDetails}>
             <span style={styles.userName}>{explorerName  }</span>
             
            <button onClick={handleLogout} style={styles.logoutLink}>
  <FaSignOutAlt style={{ marginRight: '5px' }} /> Logout
</button>
           </div>
        </div>
      </div>
    )}
  </div>
</div>

      





<div style={styles.avatarWrapper}>
  
   
  {status === "Thinking..." && (
    <div style={styles.thinkingBubble}>
      Thinking
    </div>
  )}

  {status === "Listening..." && (
    <div style={styles.listeningBubble}>
      I'm Listening! 
    </div>
  )}

   
  <div style={{
  ...styles.avatarContainer,
 
  animation: (status === "Listening..." || status === "Speaking...") 
    ? "gentleFade 0.5s ease-out, glowPulse 2s infinite ease-in-out" 
    : "none",
  
  borderColor: status === "Listening..." ? "#FF4500" : "#63918b"
}}>
  {status === "Speaking..." ? (
    <video
      src="/Quizzy_V.mp4"
      autoPlay
      loop
      muted
      playsInline
      style={styles.avatarMedia}
    />
  ) : (
    <img
      src="/cute.jpg"
      style={{
        ...styles.avatarMedia,
      
        animation: (status === "Thinking..." || status === "Listening...") ? "pulse 1.5s infinite" : "none"
      }}
      alt="Quizzy"
    />
  )}
</div>
</div>

      {isChatOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.chatHeader}>
            <span>Chat Log</span>
             
              <FaTrashAlt  color="#ff8fab"  onClick={clearChat} style={styles.clearBtn} title="Clear Chat" />
               
          </div>
          <div style={styles.chatBody}>
            {chatHistory.filter(m => m.role !== 'system').map((msg, i) => (
              <div key={i} style={msg.role === 'user' ? styles.userMsg : styles.aiMsg}>
                 
                 {Array.isArray(msg.content) ? (
        <>
          {msg.content.map((part: any, idx: number) => (
            part.type === "text" ? <p key={idx}>{part.text}</p> : 
            <img key={idx} src={part.image_url?.url} style={{maxWidth: '100%', borderRadius: '10px'}} />
          ))}
        </>
      ) : (
       
        msg.content
      )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={styles.chatInputRow}>


            <input 
    type="file" 
    accept="image/*" 
    id="imageUpload" 
    style={{ display: "none" }} 
    onChange={handleImageUpload} 
    
  />
  
 
  <label htmlFor="imageUpload" style={styles.cameraBtn}>
    <FaCamera size={26} color="#ff8fab" />
  </label>
            <input 
              style={styles.inputField} 
              value={textInput} 
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type here..."
              onKeyDown={(e) => e.key === 'Enter' && talkToQuizzy(textInput)}
            />
      
  <FaPaperPlane size={26}   
  onClick={() => { talkToQuizzy(textInput); setTextInput(""); }} color="#ff8fab" style={{ marginLeft: "-2px" , cursor:"pointer" }} /> 


          </div>
        </div>
      )}

      <div style={styles.footer}>
    <button
      onClick={() => { sttRef.current.start(); setStatus("Listening..."); }}
      disabled={!isReady || isProcessing.current}
      style={styles.talkBtn}
    >
      Start Talking
    </button>
    
    <button
      onClick={stopConversation}
      disabled={!isReady}
      style={styles.endBtn}
    >
      End Conversation
    </button>
  </div>

      <style>{`
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}






const styles: { [key: string]: React.CSSProperties } = {
  container: { 
    height: "100vh", width: "100vw", display: "flex", flexDirection: "column", 
    justifyContent: "space-between", alignItems: "center", backgroundColor: "#ffffff", 
    fontFamily: "'Comic Sans MS', cursive, sans-serif", position: "relative", overflow: "hidden" 
  },
  avatarWrapper: {
    flex:"1",
    position: "relative",  
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "20px",
    width:"100%"
  },
 thinkingBubble: {
    position: "absolute",
    top: "70px",
    left: "55%",
    backgroundColor: "#63918b", 
    color: "white",
    padding: "12px 20px",
    borderRadius: "25px 25px 25px 5px",
    fontWeight: "bold",
    fontSize: "1.3rem",
     
    zIndex: 10,
    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
    animation: "fadeIn 0.5s ease-in-out",
  },
  
  navBar: { 
    width: "100%", padding: "0 20px", display: "flex", height: "80px",backgroundColor: "#63918b",
    justifyContent: "space-between", alignItems: "center", boxSizing: "border-box", zIndex: 10  ,position:"relative"
  },
  

 navTitle: { color: "black", fontSize: "1.8rem", margin: 0, fontWeight: "bold" },
 
  
 
  
  profilePopup: {
    position: "absolute",
    
    top: "60px", 
    right: "50px",
    width: "220px",
    backgroundColor: "#f5e8e8",  
    borderRadius: "5px",
    border:"1.6px solid #ff8fab",
    padding: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    zIndex: 100,
  },
  popupContent: { display: "flex", alignItems: "center", gap: "10px" },

 avatarInitial: { 
    width: "40px", height: "40px", borderRadius: "50%", background: "#ff8fab", 
    color: "white", display: "flex", alignItems: "center", justifyContent: "center",  cursor:"pointer" ,
    fontWeight: "bold", fontSize: "1.2rem" 
  },
  popupAvatar: {
    backgroundColor:"#ff8fab",
     width: "35px", height: "35px", borderRadius: "50%", background: "red", 
     color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold"
  },
  userName: { fontWeight: "bold", color: "#63838b", fontSize: "1rem" },
 logoutLink: { 
  background: "none", 
  border: "none", 
  color: "#f74e78", 
  fontWeight: "bold", 
  cursor: "pointer", 
  padding: 0, 
  fontSize: "0.95rem", 
  marginTop: "2px",
  display: "flex",       
  alignItems: "center"    
},
 profileDetails: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
 
 avatarContainer: {
   
    width: "180px",      
    height: "180px",
    borderRadius: "50%", 
    overflow: "hidden",
    border: "2px solid #eee",
    backgroundColor: "white"
  },
 avatarMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
 
  chatWindow: { 
    position: "absolute", top: "90px", left: "20px", width: "320px", height: "70vh", 
    background: "white", borderRadius: "20px", display: "flex", flexDirection: "column", 
    boxShadow: "0 15px 40px rgba(0,0,0,0.2)", overflow: "hidden", zIndex: 20, border: "3px solid #63868b" 
  },
  chatHeader: { 
    background: "#668B8B", color: "white", padding: "12px 15px", 
    display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold" 
  },
  chatBody: { 
    flex: 1, padding: "15px", overflowY: "auto", display: "flex", 
    flexDirection: "column", gap: "10px", backgroundColor: "#ffe9dd" 
  },
  userMsg: { 
    alignSelf: "flex-end", background: "#63838b", color: "white", 
    padding: "10px 15px", borderRadius: "18px 18px 0 18px", fontSize: "0.95rem", maxWidth: "80%" 
  },
  aiMsg: { 
    alignSelf: "flex-start", background: "white", color: "#333", 
    padding: "10px 15px", borderRadius: "18px 18px 18px 0", fontSize: "0.95rem", 
    border: "2px solid #eee", maxWidth: "80%" 
  },
  chatInputRow: { padding: "12px", display: "flex", gap: "8px", borderTop: "2px solid #eee", alignItems: "center" },
  inputField: { 
    flex: 1, padding: "10px 15px", borderRadius: "25px", border: "2px solid #eee", color :"white",
    outline: "none", fontSize: "0.9rem" 
  },
 footer: { 
    width: "100%", display: "flex", justifyContent: "center", gap: "20px", 
    paddingBottom: "50px", marginTop: "auto" 
  },
  
mainBtn: { 
    padding: "12px 25px", borderRadius: "25px", border: "none", 
    backgroundColor: "#668B8B", color: "white", fontWeight: "bold", 
    fontSize: "1.1rem", cursor: "pointer" 
  },
  talkBtn: { 
    padding: "15px 30px", 
    borderRadius: "30px", 
    border: "none", 
    backgroundColor: "#668B8B", 
    color: "white", 
    fontWeight: "bold", 
    fontSize: "1.1rem", 
    cursor: "pointer",
    boxShadow: "0 4px rgba(0,0,0,0.1)"  
  },

  endBtn: { 
    padding: "15px 30px", 
    borderRadius: "30px", 
    border: "none", 
    backgroundColor: "#668B8B",  
    color: "white", 
    fontWeight: "bold", 
    fontSize: "1.1rem", 
    cursor: "pointer",
    boxShadow: "0 4px rgba(0,0,0,0.1)"
  },
  listeningBubble: {
    position: "absolute",
    top: "70px",
    left: "55%",
    backgroundColor: "#ff8fab",  
    color: "white",
    padding: "12px 20px",
    borderRadius: "25px 25px 25px 5px",
    fontWeight: "bold",
    fontSize: "1.3rem",
   
    zIndex: 10,
    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
    animation: "pulseBubble 1.5s infinite",  
  },

};

<style>{`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }


  @keyframes gentleFade {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }

 
  @keyframes glowPulse {
    0% { box-shadow: 0 0 5px rgba(255, 69, 0, 0.2); }
    50% { box-shadow: 0 0 25px rgba(255, 69, 0, 0.6); }
    100% { box-shadow: 0 0 5px rgba(255, 69, 0, 0.2); }
  }

 
  @keyframes pulse { 
    0% { transform: scale(1); } 
    50% { transform: scale(1.05); } 
    100% { transform: scale(1); } 
  }

`}</style>

