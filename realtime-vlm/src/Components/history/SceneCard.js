import React, { useState, useEffect } from "react";
// Replace with just <div> or define a Card component yourself
import { Badge } from "@/components/ui/badge";
// Use <button> ... </button> instead in your JSX
import { Camera, Clock, Smartphone, Monitor, Volume2, StopCircle } from "lucide-react";
import { format } from "date-fns";

export default function SceneCard({ scene }) {
  const CameraIcon = scene.camera_type === "front" ? Smartphone : Monitor;
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = (e) => {
    e.stopPropagation(); // Prevent card navigation
    if (!scene.description || !('speechSynthesis' in window)) return;

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }
    }

    const utterance = new SpeechSynthesisUtterance(scene.description);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (isSpeaking && speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);
  
  return (
    <Card className="glass-card border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={scene.image_url} 
            alt="Captured scene"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3">
            <Badge className="bg-black/50 text-white border-white/20">
              <CameraIcon className="w-3 h-3 mr-1" />
              {scene.camera_type === "front" ? "Front" : "Back"}
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <p className="text-slate-200 leading-relaxed text-sm flex-grow">
              {scene.description}
            </p>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSpeak}
              className="glass-card border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 flex-shrink-0"
            >
              {isSpeaking ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(scene.timestamp), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
            <a 
              href={scene.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium"
            >
              View Full Size
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}