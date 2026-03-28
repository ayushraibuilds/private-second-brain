import Link from 'next/link';
import { BrainCircuit, Lock, Search, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans selection:bg-purple-500/30">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.5)]">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SecondBrain <span className="text-purple-400 font-mono text-xs ml-1 border border-purple-500/30 px-1.5 py-0.5 rounded">LOCAL</span></span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/notes" className="text-sm font-semibold text-slate-400 hover:text-white transition">App</Link>
            <Link href="https://github.com" className="text-sm font-medium text-slate-400 hover:text-white transition">GitHub</Link>
            <Link href="/notes" className="px-5 py-2 bg-white text-black rounded-lg text-sm font-bold shadow-sm hover:bg-slate-200 transition">Try Demo</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-24 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] -z-10"></div>
          
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-sm font-medium text-slate-300 mb-8 shadow-inner">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> 100% Local. No data leaves your machine.
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
              Your thoughts, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">instantly retrievable.</span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              A private, open-source note-taking app with a built-in Local LLM. Chat with your PDFs, markdown, and ideas without compromising privacy.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/notes" className="px-8 py-4 bg-white text-black rounded-xl text-lg font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all">
                Open App <ArrowRight className="inline ml-2 w-5 h-5"/>
              </Link>
              <button className="px-8 py-4 bg-slate-900 border border-slate-800 text-white rounded-xl text-lg font-bold hover:bg-slate-800 transition-all">
                Quick Start Guide
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 border-t border-white/5 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Privacy First</h3>
                <p className="text-slate-400 leading-relaxed">Runs entirely on Ollama or local models. Your personal brain dump stays entirely on your hard drive.</p>
              </div>
              
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6">
                  <Search className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Semantic Search</h3>
                <p className="text-slate-400 leading-relaxed">Don't remember the exact keyword? Just ask. The integrated vector database finds concepts, not just words.</p>
              </div>
              
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Instant Chat</h3>
                <p className="text-slate-400 leading-relaxed">Select a few documents and spin up a chat. Summarize PDFs or brainstorm ideas using your own context.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
