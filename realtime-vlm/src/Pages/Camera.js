import React, { useState, useEffect, useRef } from "react";
import { InvokeLLM, UploadFile } from "@/integrations/Core";
import { CapturedScene } from "@/entities/CapturedScene";
import { toast } from "sonner";

import CameraFeed from "../Components/camera/CameraFeed";
import CameraControls from "../Components/camera/CameraControls";
import LiveDescription from "../Components/camera/LiveDescription";

export default function CameraPage() {
  const [isActive, setIsActive] = useState(false);
  const [currentCamera, setCurrentCamera] = useState("environment");
  const [stream, setStream] = useState(null);
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  
  const analysisIntervalRef = useRef(null);
  const videoRef = useRef(null);

  const captureFrame = () => {
    if (!stream) return null;
    
    const video = document.querySelector('video');
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
  };

  const analyzeScene = async () => {
    if (!stream || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const blob = await captureFrame();
      if (!blob) return;
      
      const file = new File([blob], 'camera-frame.jpg', { type: 'image/jpeg' });
      const { file_url } = await UploadFile({ file });
      
      const result = await InvokeLLM({
        prompt: "Describe what you see in this image in detail. Focus on the main subjects, their activities, the environment, and any notable details. Be descriptive but concise, around 2-3 sentences.",
        file_urls: [file_url]
      });
      
      setDescription(result);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error analyzing scene:", error);
      setError("Failed to analyze scene. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startAnalysis = () => {
    // Initial analysis
    setTimeout(analyzeScene, 2000);
    
    // Set up interval for continuous analysis
    analysisIntervalRef.current = setInterval(analyzeScene, 5000);
  };

  const stopAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  };

  const handleToggleCamera = () => {
    setIsActive(!isActive);
    setError("");
  };

  const handleSwitchCamera = () => {
    setCurrentCamera(prev => prev === "user" ? "environment" : "user");
  };

  const handleStreamReady = (newStream) => {
    setStream(newStream);
    if (newStream) {
      startAnalysis();
    }
  };

  const handleCapture = async () => {
    if (!stream || isCapturing) return;
    
    setIsCapturing(true);
    try {
      const blob = await captureFrame();
      if (!blob) return;
      
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const { file_url } = await UploadFile({ file });
      
      await CapturedScene.create({
        description: description || "Captured scene",
        image_url: file_url,
        timestamp: new Date().toISOString(),
        camera_type: currentCamera
      });
      
      toast.success("Scene captured and saved!");
    } catch (error) {
      console.error("Error capturing scene:", error);
      toast.error("Failed to capture scene");
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    return () => {
      stopAnalysis();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isActive && stream) {
      startAnalysis();
    } else {
      stopAnalysis();
      setDescription("");
      setLastUpdated("");
    }
    
    return () => stopAnalysis();
  }, [isActive, stream]);

  // Check if device supports camera switching
  const canSwitchCamera = typeof navigator !== 'undefined' && 
                         navigator.mediaDevices && 
                         /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Live Scene Vision</h1>
          <p className="text-slate-400 text-lg">
            Real-time AI-powered description of what your camera sees
          </p>
        </div>

        {/* Camera Feed */}
        <div className="space-y-6">
          <CameraFeed
            isActive={isActive}
            onStreamReady={handleStreamReady}
            currentCamera={currentCamera}
            error={error}
          />
          
          <CameraControls
            isActive={isActive}
            onToggleCamera={handleToggleCamera}
            onSwitchCamera={handleSwitchCamera}
            onCapture={handleCapture}
            canSwitchCamera={canSwitchCamera}
            isCapturing={isCapturing}
          />
        </div>

        {/* Live Description */}
        <LiveDescription
          description={description}
          isLoading={isAnalyzing}
          lastUpdated={lastUpdated}
        />

        {/* Instructions */}
        <div className="glass-card border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3">How it works</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Click "Start Camera" to begin live scene analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>The AI analyzes your camera feed every 5 seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Use the rotate button to switch between front and back camera</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Capture interesting moments to save them with descriptions</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}