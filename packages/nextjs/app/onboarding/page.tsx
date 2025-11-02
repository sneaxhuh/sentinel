"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, User, Building, Github, Wallet, Zap, CheckCircle, DollarSign, Users, Activity, TrendingUp, BarChart3, Code, Shield, Target, Terminal } from "lucide-react";

export default function OnboardingPage() {
  const handleGetStarted = () => {
    window.location.href = "/create-issue";
  };

  const handleGoToTest = () => {
    window.location.href = "/test";
  };

  return (
    <div 
      className="min-h-screen bg-black font-upheaval relative"
      style={{
        backgroundImage: "url('/background.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "repeat",
        backgroundAttachment: "scroll"
      }}
    >
      {/* Reduced dark overlay for higher background intensity */}
      <div className="absolute inset-0 bg-black/30 z-0"></div>
      
      {/* Enhanced Green grid overlay effect */}
      <div className="absolute inset-0 opacity-40 z-0" 
           style={{
             backgroundImage: `
               linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
               linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
             `,
             backgroundSize: '40px 40px'
           }}>
      </div>
      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 min-h-screen flex flex-col justify-center">
        
        {/* Glitch effect elements */}
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-green-400/30 opacity-60 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-green-500/25 opacity-45 animate-pulse delay-300"></div>
        
        <div className="text-center space-y-12 relative z-10">
          
          {/* Main Title with Glitch Effect */}
          <div className="mb-8 group relative">
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-500 uppercase tracking-wider relative">
              <span className="relative inline-block">
                SENTINEL
                {/* Glitch overlay */}
                <span className="absolute inset-0 text-green-400 opacity-70 animate-pulse" style={{textShadow: '2px 0 red, -2px 0 cyan'}}>
                  SENTINEL
                </span>
              </span>
            </h1>
            
            {/* Subtitle */}
            
          </div>

          {/* Main Description Box */}
          <div className="mt-8 md:mt-16 w-full max-w-4xl mx-auto border border-dashed border-green-400">
            
            {/* Prize Header */}
            <section className="flex items-center justify-center w-full text-center bg-gradient-to-b from-green-950/90 to-green-600/50 py-6 font-bold border-b border-green-400/70 border-dashed">
              <p className="text-2xl sm:text-4xl uppercase text-white leading-6 font-upheaval">
                TRUSTLESS OPEN SOURCE COLLABORATION
              </p>
            </section>
            
            {/* Description */}
            <div className="px-8 py-8 bg-black/80">
              <p className="text-base md:text-lg text-green-100 leading-relaxed max-w-3xl mx-auto">
                A blockchain-backed platform that makes open-source collaboration{' '}
                <span className="text-green-400 font-bold uppercase">trustless</span>,{' '}
                <span className="text-green-400 font-bold uppercase">fair</span>, and{' '}
                <span className="text-green-400 font-bold uppercase">secure</span>.{' '}
                Deployed on <span className="text-green-400 font-bold uppercase">Polkadot&apos;s Moonbase parachain</span> with{' '}
                <span className="text-green-400 font-bold uppercase">verifiable AI agents</span> and{' '}
                <span className="text-green-400 font-bold uppercase">zk-based verification</span>.
              </p>
            </div>
            
            {/* Action Button */}
            <div className="p-6 bg-black/60 border-t border-green-400/30 border-dashed">
              <Button
                onClick={handleGetStarted}
                className="w-full md:w-auto bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-black font-bold text-lg py-4 px-12 border-2 border-green-400 transition-all duration-300 transform hover:scale-105 uppercase tracking-wider"
              >
                START BUILDING
              </Button>
            </div>
          </div>

          {/* Countdown Timer */}
          

        </div>
      </section>
      {/* Platform Statistics Dashboard */}
      <section className="bg-black/20 py-20 border-t border-green-400/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-green-400 mb-6 uppercase tracking-wider font-upheaval">
              PLATFORM STATISTICS
            </h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Real-time metrics and statistics from the Sentinel ecosystem
            </p>
          </div>
          
          {/* Statistics Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Repositories */}
            <div className="group relative bg-black/40 border-2 border-green-400/50 p-6 cursor-pointer transition-all duration-300 hover:border-green-400 hover:bg-green-900/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-400/20 border-2 border-green-400 p-3 group-hover:bg-green-400 group-hover:text-black transition-all duration-300">
                  <DollarSign className="w-6 h-6 text-green-400 group-hover:text-black" />
                </div>
                <span className="text-sm font-bold text-green-400 bg-green-400/20 px-3 py-1 border border-green-400 font-mono">+12.5%</span>
              </div>
              <h3 className="text-3xl font-bold text-green-400 mb-1 font-mono">2,847</h3>
              <p className="text-green-100 font-mono uppercase text-sm">REPOSITORIES</p>
            </div>

            {/* Active Developers */}
            <div className="group relative bg-black/40 border-2 border-green-400/50 p-6 cursor-pointer transition-all duration-300 hover:border-green-400 hover:bg-green-900/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-400/20 border-2 border-green-400 p-3 group-hover:bg-green-400 group-hover:text-black transition-all duration-300">
                  <Users className="w-6 h-6 text-green-400 group-hover:text-black" />
                </div>
                <span className="text-sm font-bold text-green-400 bg-green-400/20 px-3 py-1 border border-green-400 font-mono">+8.2%</span>
              </div>
              <h3 className="text-3xl font-bold text-green-400 mb-1 font-mono">1,247</h3>
              <p className="text-green-100 font-mono uppercase text-sm">ACTIVE DEVS</p>
            </div>

            {/* Issues Resolved */}
            <div className="group relative bg-black/40 border-2 border-green-400/50 p-6 cursor-pointer transition-all duration-300 hover:border-green-400 hover:bg-green-900/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-400/20 border-2 border-green-400 p-3 group-hover:bg-green-400 group-hover:text-black transition-all duration-300">
                  <Activity className="w-6 h-6 text-green-400 group-hover:text-black" />
                </div>
                <span className="text-sm font-bold text-green-400 bg-green-400/20 px-3 py-1 border border-green-400 font-mono">+15.7%</span>
              </div>
              <h3 className="text-3xl font-bold text-green-400 mb-1 font-mono">45,234</h3>
              <p className="text-green-100 font-mono uppercase text-sm">ISSUES FIXED</p>
            </div>

            {/* Network Uptime */}
            <div className="group relative bg-black/40 border-2 border-green-400/50 p-6 cursor-pointer transition-all duration-300 hover:border-green-400 hover:bg-green-900/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-400/20 border-2 border-green-400 p-3 group-hover:bg-green-400 group-hover:text-black transition-all duration-300">
                  <TrendingUp className="w-6 h-6 text-green-400 group-hover:text-black" />
                </div>
                <span className="text-sm font-bold text-green-400 bg-green-400/20 px-3 py-1 border border-green-400 font-mono">+22.1%</span>
              </div>
              <h3 className="text-3xl font-bold text-green-400 mb-1 font-mono">99.9%</h3>
              <p className="text-green-100 font-mono uppercase text-sm">UPTIME</p>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-black/20 py-20 border-t border-green-400/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-green-400 mb-6 uppercase tracking-wider font-upheaval">
              HOW IT WORKS
            </h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Get started with Sentinel in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting flow lines */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-green-400 via-green-500 to-green-400 opacity-50"></div>
            
            {/* Step 1 */}
            <div className="group text-center cursor-pointer transition-all duration-700 hover:-translate-y-2 relative">
              <div className="bg-black/40 border-2 border-green-400/50 p-8 group-hover:border-green-400 group-hover:bg-green-900/30 transition-all duration-300 backdrop-blur-sm">
                
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="w-16 h-16 bg-green-400 border-2 border-green-400 flex items-center justify-center font-mono text-black text-2xl font-bold">
                    01
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-wider font-mono">CONNECT ACCOUNTS</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Link your GitHub account and Polkadot wallet to access the platform with zk-based identity verification
                </p>
                
                <div className="mt-6 h-px bg-green-400 w-full"></div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group text-center cursor-pointer transition-all duration-700 hover:-translate-y-2 relative">
              <div className="bg-black/40 border-2 border-green-400/50 p-8 group-hover:border-green-400 group-hover:bg-green-900/30 transition-all duration-300 backdrop-blur-sm">
                
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="w-16 h-16 bg-green-400 border-2 border-green-400 flex items-center justify-center font-mono text-black text-2xl font-bold">
                    02
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-wider font-mono">STAKE & SECURE</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Deploy two-sided staking contracts where both repo owners and issue solvers stake tokens for fair collaboration
                </p>
                
                <div className="mt-6 h-px bg-green-400 w-full"></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group text-center cursor-pointer transition-all duration-700 hover:-translate-y-2 relative">
              <div className="bg-black/40 border-2 border-green-400/50 p-8 group-hover:border-green-400 group-hover:bg-green-900/30 transition-all duration-300 backdrop-blur-sm">
                
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="w-16 h-16 bg-green-400 border-2 border-green-400 flex items-center justify-center font-mono text-black text-2xl font-bold">
                    03
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-wider font-mono">COLLABORATE & VERIFY</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Work with verifiable AI agents on Moonbase parachain, preventing collusion and ensuring fair rewards
                </p>
                
                <div className="mt-6 h-px bg-green-400 w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Snow on Fig */}
      

      {/* Footer */}
      <footer className="bg-black/20 py-12 border-t border-green-400/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-green-400 mb-4 font-upheaval uppercase">SENTINEL</h3>
              <p className="text-green-100 text-sm">
                Blockchain-backed platform deployed on Polkadot&apos;s Moonbase parachain. Making open-source collaboration trustless, fair, and secure with verifiable AI and zk-based identity verification.
              </p>
            </div>
            
            <div>
              <h4 className="text-green-400 mb-4 font-upheaval uppercase text-sm font-bold">PLATFORM</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-green-100 hover:text-green-400 text-sm transition-colors duration-300">SMART CONTRACTS</a></li>
                <li><a href="#" className="text-green-100 hover:text-green-400 text-sm transition-colors duration-300">GITHUB INTEGRATION</a></li>
                <li><a href="#" className="text-green-100 hover:text-green-400 text-sm transition-colors duration-300">WALLET TOOLS</a></li>
                <li><a href="#" className="text-green-100 hover:text-green-400 text-sm transition-colors duration-300">ANALYTICS</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-green-400 mb-4 font-upheaval uppercase text-sm font-bold">RESOURCES</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-green-100 hover:text-green-400 text-sm transition-colors duration-300">DOCUMENTATION</a></li>
                <li><a href="#" className="text-green-100 hover:text-green-400 text-sm transition-colors duration-300">GITHUB</a></li>
                <li><a href="#" className="text-green-100 hover:text-green-400 text-sm transition-colors duration-300">COMMUNITY</a></li>
                <li><a href="#" className="text-green-100 hover:text-green-400 text-sm transition-colors duration-300">SUPPORT</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-green-400/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-green-400 font-upheaval font-bold text-lg">SENTINEL</div>
              <div className="text-green-100 text-sm">
               
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Test Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleGoToTest}
          className="bg-green-600 hover:bg-green-700 text-black font-bold py-3 px-4 border-2 border-green-400 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-green-400/30 font-mono uppercase tracking-wide"
          title="Go to Test Suite"
        >
          <Terminal className="w-5 h-5 mr-2" />
          TEST
        </Button>
      </div>
    </div>
  );
}