'use client';

import { useState } from 'react';
import { Search, Folder, FileText, Plus, MessageSquare, Maximize2, X, Send, Bot, User, Hash } from 'lucide-react';
import Link from 'next/link';
import { GlassEmptyState } from '@/components/ui/GlassEmptyState';

export default function NotesApp() {
  const [selectedNote, setSelectedNote] = useState<number | null>(1);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  // Dummy State
  const notes = [
    { id: 1, title: 'Project Arch Setup', concept: 'technical', snippet: 'To configure Docker we need...' },
    { id: 2, title: 'Meeting Notes - Aug 12', concept: 'work', snippet: 'Discussed the new feature roadmap...' },
    { id: 3, title: 'Machine Learning Basics', concept: 'learning', snippet: 'Gradient descent is an optimization...' }
  ];

  return (
    <div className="flex h-screen bg-[#0f0f11] text-slate-300 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col z-10">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <Link href="/" className="font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-xs">SB</span> SecondBrain
          </Link>
        </div>
        
        <div className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search or ask anything..." 
              className="w-full bg-[#1e1e24] border border-[#2d2d35] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-purple-500 focus:bg-[#22222a] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <div className="mb-2 px-2 text-xs font-bold text-slate-600 uppercase tracking-wider">Your Notes</div>
          <div className="space-y-1">
            {notes.map(note => (
              <button 
                key={note.id}
                onClick={() => setSelectedNote(note.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${selectedNote === note.id ? 'bg-purple-600/10 text-purple-300' : 'hover:bg-[#1e1e24] text-slate-400'}`}
              >
                <div className="font-medium text-sm text-slate-200 truncate">{note.title}</div>
                <div className="text-xs opacity-60 truncate mt-0.5">{note.snippet}</div>
                <div className="flex items-center gap-1 mt-1.5 opacity-50">
                  <Hash className="w-3 h-3"/><span className="text-[10px] uppercase">{note.concept}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-[#222]">
          <button className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition">
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col relative bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[80px] z-0"></div>
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-10">
          <div className="font-medium text-slate-200">{selectedNote ? 'Editing Note' : 'No note selected'}</div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isChatOpen ? 'bg-purple-600/20 text-purple-400' : 'bg-[#1e1e24] text-slate-300 hover:bg-[#2a2a35]'}`}
            >
              <MessageSquare className="w-4 h-4" /> Ask AI
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 z-10">
          {selectedNote ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <input 
                type="text" 
                defaultValue="Project Arch Setup" 
                className="w-full bg-transparent text-4xl font-bold text-slate-100 outline-none placeholder-slate-700"
                placeholder="Note Title"
              />
              <textarea 
                className="w-full h-96 bg-transparent text-lg text-slate-300 outline-none resize-none placeholder-slate-700 leading-relaxed"
                defaultValue="To configure Docker we need to set up the multi-container orchestration. Make sure volume mounts point to the correct DB path."
                placeholder="Start typing..."
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center pt-24 text-slate-600">
               <GlassEmptyState 
                 icon={<FileText className="w-10 h-10" />} 
                 title="No Note Selected" 
                 description="Select a note from the sidebar to begin editing, or create a new one. Your local second brain is ready." 
               />
            </div>
          )}
        </div>

        {/* Global Chat / Ask AI Panel */}
        {isChatOpen && (
          <div className="absolute right-0 top-14 bottom-0 w-96 border-l border-white/10 bg-black/40 backdrop-blur-3xl flex flex-col shadow-2xl animate-in slide-in-from-right-8 duration-200 z-20">
            <div className="p-4 border-b border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Bot className="w-4 h-4 text-purple-500" /> SecondBrain AI
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-500 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-[#1e1e24] p-3 rounded-lg border border-[#2d2d35] text-sm text-slate-300 leading-relaxed shadow-sm">
                <span className="text-xs font-bold text-purple-400 mb-1 block">AI</span>
                Hi! Ask me anything about your notes. You can also type <code>/context</code> to chat specifically about the current open note.
              </div>
            </div>
            
            <div className="p-4 border-t border-[#222]">
              <div className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your brain..." 
                  className="w-full bg-[#1e1e24] border border-[#2d2d35] rounded-xl pl-4 pr-10 py-3 text-sm text-slate-200 outline-none focus:border-purple-500 transition-all shadow-inner"
                />
                <button className="absolute right-2 top-2 bottom-2 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
