import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, History, Eye } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <style>
        {`
          :root {
            --primary: #0f172a;
            --secondary: #1e293b;
            --accent: #3b82f6;
            --accent-bright: #60a5fa;
            --glass: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
            --text-primary: #f8fafc;
            --text-secondary: #cbd5e1;
          }
          
          .glass-card {
            background: var(--glass);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
          }
          
          .gradient-text {
            background: linear-gradient(135deg, var(--accent-bright), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        `}
      </style>
      
      {/* Navigation Header */}
      <header className="relative z-50 p-4">
        <nav className="max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">VisionAI</h1>
                  <p className="text-xs text-slate-400">Real-time Scene Description</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link 
                  to={createPageUrl("Camera")}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    currentPageName === "Camera" 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Live View</span>
                </Link>
                <Link 
                  to={createPageUrl("History")}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    currentPageName === "History" 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="pb-8">
        {children}
      </main>
    </div>
  );
}