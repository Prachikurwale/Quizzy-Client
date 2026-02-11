import { useEffect, useState } from 'react';
import { STTLogic, TTSLogic, sharedAudioPlayer } from 'speech-to-speech';

type Latencies = {
  stt?: number;
  ttsSynth?: number;
  ttsPlayback?: number;
};

function formatMs(ms?: number) {
  if (ms == null) return '--';
  if (ms >= 1000) return (ms / 1000).toFixed(2) + 's';
  return ms.toFixed(0) + ' ms';
}

function setupPatches() {
 
  const win: any = window as any;
  if (win.__latency_patched) return;
  win.__latency_patched = true;

  try {
    
    if (STTLogic && STTLogic.prototype) {
      const origStart = STTLogic.prototype.start;
      const origStop = STTLogic.prototype.stop;
      if (origStart) {
        STTLogic.prototype.start = function (...args: any[]) {
          try { (this as any).__stt_start = performance.now(); window.dispatchEvent(new CustomEvent('latencyUpdate',{detail:{type:'stt_start'}})); } catch {}
          return (origStart as any).apply(this, args);
        };
      }
      if (origStop) {
        STTLogic.prototype.stop = function (...args: any[]) {
          const res = (origStop as any).apply(this, args);
          try {
            const start = (this as any).__stt_start;
            if (start) {
              const dur = performance.now() - start;
              window.dispatchEvent(new CustomEvent('latencyUpdate',{detail:{type:'stt', duration: dur}}));
            }
          } catch {}
          return res;
        };
      }
    }

     
    if (TTSLogic && TTSLogic.prototype) {
      const origSynth = TTSLogic.prototype.synthesize;
      if (origSynth) {
        TTSLogic.prototype.synthesize = async function (...args: any[]) {
          const t0 = performance.now();
          const res = await (origSynth as any).apply(this, args);
          try {
            const dur = performance.now() - t0;
            window.dispatchEvent(new CustomEvent('latencyUpdate',{detail:{type:'tts_synth', duration: dur}}));
          } catch {}
          return res;
        };
      }
    }

     
    try {
      const player: any = sharedAudioPlayer as any;
      if (player) {
        if (player.addAudioIntoQueue) {
          const origAdd = player.addAudioIntoQueue.bind(player);
          player.addAudioIntoQueue = function (...args: any[]) {
            try { this.__lastQueuedAt = performance.now(); } catch {}
            return origAdd(...args);
          };
        }
        if (player.waitForQueueCompletion) {
          const origWait = player.waitForQueueCompletion.bind(player);
          player.waitForQueueCompletion = async function (...args: any[]) {
            const start = this.__lastQueuedAt || performance.now();
            const res = await origWait(...args);
            try {
              const dur = performance.now() - start;
              window.dispatchEvent(new CustomEvent('latencyUpdate',{detail:{type:'tts_playback', duration: dur}}));
            } catch {}
            return res;
          };
        }
      }
    } catch {}
  } catch (e) {
     
  }
}

export default function LatencyOverlay() {
  const [latencies, setLatencies] = useState<Latencies>({});

  useEffect(() => {
    setupPatches();

    function onUpdate(e: any) {
      const d = e?.detail;
      if (!d) return;
      setLatencies((prev) => ({
        ...prev,
        stt: d.type === 'stt' ? d.duration : prev.stt,
        ttsSynth: d.type === 'tts_synth' ? d.duration : prev.ttsSynth,
        ttsPlayback: d.type === 'tts_playback' ? d.duration : prev.ttsPlayback,
      }));
    }

    window.addEventListener('latencyUpdate', onUpdate as EventListener);
    return () => window.removeEventListener('latencyUpdate', onUpdate as EventListener);
  }, []);

  return (
    <div style={{position:'fixed', right:12, top:120, zIndex:9999}}>
      <div style={{background:'rgba(255,255,255,0.95)', padding:'8px 10px', borderRadius:8, boxShadow:'0 4px 10px rgba(0,0,0,0.15)', fontSize:12, color:'#111', minWidth:120}}>
        <div style={{fontWeight:700, marginBottom:6}}>Latency</div>
        <div style={{display:'flex', justifyContent:'space-between'}}><div>STT</div><div>{formatMs(latencies.stt)}</div></div>
        <div style={{display:'flex', justifyContent:'space-between'}}><div>TTS synth</div><div>{formatMs(latencies.ttsSynth)}</div></div>
        <div style={{display:'flex', justifyContent:'space-between'}}><div>Playback</div><div>{formatMs(latencies.ttsPlayback)}</div></div>
      </div>
    </div>
  );
}
