import React, { useRef, useEffect } from "react";
// Replace with just <div> or define a Card component yourself
import { AlertCircle, Camera } from "lucide-react";

export default function CameraFeed({ 
  isActive, 
  onStreamReady, 
  currentCamera, 
  error 
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: currentCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        onStreamReady(stream);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isActive, currentCamera]);

  if (error) {
    return (
      <Card className="glass-card border-red-500/20 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Camera Access Error</h3>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-white/10 shadow-2xl overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-slate-800/50">
          {isActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-400 text-sm">Camera is off</p>
              </div>
            </div>
          )}
          
          {isActive && (
            <div className="absolute top-4 left-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/80 backdrop-blur-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">LIVE</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}