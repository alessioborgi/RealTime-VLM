import React, { useState, useEffect } from "react";
// Replace with just <div> or define a Card component yourself
// Use <button> ... </button> instead in your JSX
import { Loader2, Eye, Sparkles, Volume2, StopCircle } from "lucide-react";

export default function LiveDescription({ description, isLoading, lastUpdated }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (!description || !('speechSynthesis' in window)) {
      return;
    }

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(description);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    // When a new description arrives, stop the old one from playing.
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description]);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <Card className="glass-card border-white/10 shadow-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Scene Description</h3>
              <p className="text-xs text-slate-400">
                {isLoading && description ? "Updating..." : lastUpdated ? `Updated ${lastUpdated}` : "Waiting for analysis..."}
              </p>
            </div>
            {isLoading && description && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSpeak}
            disabled={!description}
            className="glass-card border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 flex-shrink-0"
          >
            {isSpeaking ? <StopCircle className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
        
        <div className="relative min-h-[120px] flex items-center">
          {description ? (
            <div className="space-y-3">
              <p className="text-slate-200 leading-relaxed text-base">
                {description}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="w-3 h-3" />
                <span>Powered by AI Vision</span>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center w-full">
              <div className="flex items-center gap-3 text-slate-300">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Analyzing scene...</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full text-slate-400">
              <div className="text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start the camera to see live descriptions</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}