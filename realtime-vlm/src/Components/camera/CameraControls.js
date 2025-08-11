import React from "react";
// Use <button> ... </button> instead in your JSX
import { RotateCcw, Camera, Square, Play } from "lucide-react";

export default function CameraControls({ 
  isActive, 
  onToggleCamera, 
  onSwitchCamera, 
  onCapture, 
  canSwitchCamera,
  isCapturing 
}) {
  return (
    <div className="flex items-center justify-center gap-4 p-6">
      <Button
        variant="outline"
        size="lg"
        onClick={onSwitchCamera}
        disabled={!canSwitchCamera || !isActive}
        className="glass-card border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
      >
        <RotateCcw className="w-5 h-5" />
      </Button>
      
      <Button
        size="lg"
        onClick={onToggleCamera}
        className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
          isActive 
            ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/25" 
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25"
        }`}
      >
        {isActive ? (
          <>
            <Square className="w-5 h-5 mr-2" />
            Stop Camera
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            Start Camera
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        size="lg"
        onClick={onCapture}
        disabled={!isActive || isCapturing}
        className="glass-card border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
      >
        <Camera className="w-5 h-5" />
      </Button>
    </div>
  );
}