import React, { useState, useEffect, useRef } from "react";
import { Upload, AlertTriangle, CheckCircle2, Loader2, Car, Shield, Flame, Siren } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { detectEmergencyVehicle, generateBenefitsPoster } from "./services/geminiService";

type TrafficState = "RED" | "YELLOW" | "GREEN" | "EMERGENCY";

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [trafficState, setTrafficState] = useState<TrafficState>("RED");
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("System Ready");
  const [isEmergency, setIsEmergency] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normal traffic cycle effect
  useEffect(() => {
    if (isEmergency || isProcessing) return;

    const cycle = async () => {
      setTrafficState("RED");
      setStatus("Normal Traffic: RED");
      await new Promise(r => setTimeout(r, 3000));
      if (isEmergency || isProcessing) return;

      setTrafficState("YELLOW");
      setStatus("Normal Traffic: YELLOW");
      await new Promise(r => setTimeout(r, 3000));
      if (isEmergency || isProcessing) return;

      setTrafficState("GREEN");
      setStatus("Normal Traffic: GREEN");
      await new Promise(r => setTimeout(r, 3000));
    };

    const interval = setInterval(cycle, 9000);
    cycle(); // Start first cycle

    return () => clearInterval(interval);
  }, [isEmergency, isProcessing]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(",")[1];
      setImage(event.target?.result as string);
      setMimeType(file.type);
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string, type: string) => {
    setIsProcessing(true);
    setIsEmergency(false);
    setPosterUrl(null);
    setStatus("Analyzing Image...");

    try {
      const detected = await detectEmergencyVehicle(base64, type);
      
      if (detected) {
        setIsEmergency(true);
        setTrafficState("EMERGENCY");
        setStatus("🚨 EMERGENCY VEHICLE DETECTED! PRIORITIZING GREEN LIGHT.");
        
        // Generate poster
        const poster = await generateBenefitsPoster();
        setPosterUrl(poster);
      } else {
        setIsEmergency(false);
        setStatus("No emergency vehicle detected. Resuming normal cycle.");
        // Cycle will resume automatically due to useEffect dependencies
      }
    } catch (error) {
      console.error(error);
      setStatus("Error processing image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSystem = () => {
    setImage(null);
    setMimeType(null);
    setIsEmergency(false);
    setPosterUrl(null);
    setStatus("System Ready");
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & Upload */}
        <div className="lg:col-span-4 space-y-6">
          <header className="border-b border-[#141414] pb-4">
            <h1 className="text-3xl font-serif italic font-bold tracking-tight">Pollution Reducing Emergency Vehicles in Traffic</h1>
            <p className="text-xs uppercase tracking-widest opacity-60 mt-1 font-mono">Emergency Priority System v2.1</p>
          </header>

          <div className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="font-serif italic text-lg mb-4">Vehicle Detection</h2>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#141414] p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*"
              />
              {image ? (
                <img src={image} alt="Uploaded" className="max-h-48 mx-auto rounded border border-[#141414]" referrerPolicy="no-referrer" />
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity" />
                  <p className="text-sm font-mono uppercase">Upload Traffic Image</p>
                  <p className="text-[10px] opacity-50">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>

            {image && (
              <button 
                onClick={resetSystem}
                className="w-full mt-4 py-2 border border-[#141414] text-xs uppercase font-mono hover:bg-[#141414] hover:text-white transition-all"
              >
                Reset System
              </button>
            )}
          </div>

          <div className="bg-white border border-[#141414] p-4 font-mono text-[11px] space-y-2">
            <div className="flex justify-between border-b border-gray-100 pb-1">
              <span className="opacity-50">STATUS:</span>
              <span className={isProcessing ? "animate-pulse text-blue-600" : ""}>{status}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-1">
              <span className="opacity-50">EMERGENCY MODE:</span>
              <span className={isEmergency ? "text-red-600 font-bold" : "text-green-600"}>{isEmergency ? "ACTIVE" : "INACTIVE"}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50">NETWORK:</span>
              <span>STABLE</span>
            </div>
          </div>
        </div>

        {/* Middle Column: Traffic Light */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center space-y-8">
          <div className="bg-[#141414] p-6 rounded-[40px] shadow-2xl border-4 border-[#2a2a2a] w-32 space-y-4">
            {/* Red Light */}
            <div className={`w-20 h-20 rounded-full border-4 border-[#2a2a2a] transition-all duration-300 flex items-center justify-center ${trafficState === "RED" ? "bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.8)]" : "bg-red-950 opacity-20"}`}>
              {trafficState === "RED" && <AlertTriangle className="text-white/40 w-8 h-8" />}
            </div>
            
            {/* Yellow Light */}
            <div className={`w-20 h-20 rounded-full border-4 border-[#2a2a2a] transition-all duration-300 ${trafficState === "YELLOW" ? "bg-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.8)]" : "bg-yellow-950 opacity-20"}`} />
            
            {/* Green Light */}
            <div className={`relative w-20 h-20 rounded-full border-4 border-[#2a2a2a] transition-all duration-300 flex items-center justify-center ${trafficState === "GREEN" || trafficState === "EMERGENCY" ? "bg-green-500 shadow-[0_0_40px_rgba(34,197,94,0.8)]" : "bg-green-950 opacity-20"}`}>
              {(trafficState === "GREEN" || trafficState === "EMERGENCY") && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center"
                >
                  {trafficState === "EMERGENCY" ? (
                    <Siren className="text-white w-10 h-10 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="text-white/40 w-8 h-8" />
                  )}
                </motion.div>
              )}
            </div>
          </div>
          
          <div className="text-center font-mono uppercase tracking-tighter">
            <p className="text-[10px] opacity-40 mb-1">Current Signal</p>
            <p className="text-xl font-bold">{trafficState}</p>
          </div>
        </div>

        {/* Right Column: Poster Display */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#141414] h-full min-h-[400px] flex flex-col shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="p-4 border-b border-[#141414] flex justify-between items-center bg-[#141414] text-white">
              <h3 className="font-mono text-xs uppercase tracking-widest">System Output: Benefits Poster</h3>
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            
            <div className="flex-1 p-8 flex items-center justify-center relative overflow-hidden bg-gray-50">
              <AnimatePresence mode="wait">
                {posterUrl ? (
                  <motion.div
                    key="poster"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="relative z-10 w-full"
                  >
                    <img 
                      src={posterUrl} 
                      alt="Benefits Poster" 
                      className="w-full h-auto border-2 border-[#141414] shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-800 text-xs font-mono">
                      <p className="font-bold mb-1">✓ EMERGENCY OVERRIDE SUCCESSFUL</p>
                      <p>Resource optimization poster generated for public awareness.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4 opacity-20"
                  >
                    <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                      <Car className="w-12 h-12 mx-auto" />
                      <Shield className="w-12 h-12 mx-auto" />
                      <Flame className="w-12 h-12 mx-auto" />
                      <Siren className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="font-mono text-sm uppercase">Waiting for Emergency Detection</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Background Grid for aesthetic */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </div>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <footer className="max-w-6xl mx-auto mt-12 pt-8 border-t border-[#141414]/10 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono opacity-40 uppercase tracking-widest gap-4">
        <div>© 2026 Smart Traffic Solutions Corp.</div>
        <div className="flex gap-8">
          <span>AI-Driven Optimization</span>
          <span>Emergency First Protocol</span>
          <span>Zero-Latency Routing</span>
        </div>
      </footer>
    </div>
  );
}
