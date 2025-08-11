import React, { useState, useEffect } from "react";
import { CapturedScene } from "@/entities/CapturedScene";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, History as HistoryIcon, Trash2 } from "lucide-react";
// Use <button> ... </button> instead in your JSX

import SceneCard from "../Components/history/SceneCard";

export default function HistoryPage() {
  const [scenes, setScenes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScenes();
  }, []);

  const loadScenes = async () => {
    try {
      const data = await CapturedScene.list("-timestamp");
      setScenes(data);
    } catch (error) {
      console.error("Error loading scenes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const SceneSkeleton = () => (
    <div className="glass-card border-white/10 rounded-2xl overflow-hidden">
      <Skeleton className="aspect-video w-full bg-slate-700/50" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-full bg-slate-700/50" />
        <Skeleton className="h-4 w-3/4 bg-slate-700/50" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-24 bg-slate-700/50" />
          <Skeleton className="h-3 w-16 bg-slate-700/50" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold gradient-text flex items-center justify-center gap-3">
            <HistoryIcon className="w-10 h-10" />
            Captured Scenes
          </h1>
          <p className="text-slate-400 text-lg">
            Browse through your saved moments and their AI descriptions
          </p>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="glass-card border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {scenes.length} Scene{scenes.length !== 1 ? 's' : ''} Captured
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Your collection of AI-analyzed moments
                  </p>
                </div>
              </div>
              
              {scenes.length > 0 && (
                <Button 
                  variant="outline" 
                  className="glass-card border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Scenes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <SceneSkeleton key={i} />
            ))
          ) : scenes.length > 0 ? (
            scenes.map((scene) => (
              <SceneCard key={scene.id} scene={scene} />
            ))
          ) : (
            <div className="col-span-full">
              <div className="glass-card border-white/10 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No scenes captured yet</h3>
                <p className="text-slate-400 mb-6">
                  Start using the live camera to capture and save interesting moments
                </p>
                <Button 
                  onClick={() => window.location.href = "/Camera"}
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}