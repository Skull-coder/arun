"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, LayoutDashboard, LineChart, MessageSquare, ShieldCheck, Star, Users, Zap, Trophy, Play, CheckCircle, FileText, Send, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useAuth } from "@clerk/nextjs";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useState } from "react";

const mockAnalyticsData = [
  { name: "Week 1", score: 65 },
  { name: "Week 2", score: 72 },
  { name: "Week 3", score: 70 },
  { name: "Week 4", score: 85 },
  { name: "Week 5", score: 82 },
  { name: "Week 6", score: 95 },
];

export function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-slate-50 selection:bg-orange-500/30 overflow-x-hidden font-sans">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 md:px-6 py-4 backdrop-blur-md bg-[#050505]/60 border-b border-orange-500/10">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-orange-600 to-red-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
          <span className="text-xl font-bold tracking-tight text-white">Arun</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {!isLoaded ? null : isSignedIn ? (
            <Button asChild className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-full px-4 md:px-6 border-none shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <Link href="/dashboard">Dashboard <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          ) : (
            <Button asChild className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-full px-4 md:px-6 border-none shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <Link href="/sign-in">Get Started</Link>
            </Button>
          )}
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-20 overflow-hidden">
        {/* The Rising Sun Animation - BIGGER */}
        <motion.div
          initial={{ y: 400, opacity: 0 }}
          animate={{ y: 100, opacity: 1 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] sm:w-[1200px] md:w-[1500px] h-[400px] sm:h-[600px] pointer-events-none"
        >
          {/* The glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-600/50 via-orange-500/30 to-transparent blur-[80px] sm:blur-[120px] rounded-t-full" />
          {/* The sun core */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] md:w-[1100px] h-[300px] sm:h-[450px] md:h-[550px] bg-gradient-to-t from-red-600 via-orange-500 to-amber-300 rounded-t-full opacity-90 blur-[4px] shadow-[0_0_200px_rgba(239,68,68,0.7)]" />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 w-full max-w-5xl mx-auto mt-0 sm:mt-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-950/30 border border-orange-500/20 text-orange-300 text-xs sm:text-sm font-medium mb-6 md:mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.1)]"
          >
            <SparklesIcon className="w-4 h-4 text-orange-400" />
            <span>The dawn of a new learning platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-4 md:mb-6 text-white drop-shadow-lg leading-[1.1]"
          >
            Built for educators, <br className="hidden md:block"/> by a student.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-lg sm:text-xl md:text-2xl text-orange-100/70 max-w-2xl md:max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed px-2"
          >
            Arun is the all-in-one platform for real-time live quizzes, robust scheduled testing, and lightning-fast assignment grading.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="w-full sm:w-auto px-4"
          >
            <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-full px-8 md:px-10 h-14 md:h-16 text-base md:text-lg font-bold shadow-[0_0_50px_rgba(239,68,68,0.5)] transition-all hover:shadow-[0_0_80px_rgba(239,68,68,0.7)] hover:scale-105 border-none">
              <Link href="/dashboard">
                Create Your Classroom <ArrowRight className="ml-2 w-5 h-5 md:w-6 md:h-6" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Fade to dark gradient at bottom of hero */}
        <div className="absolute bottom-0 inset-x-0 h-48 md:h-64 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent z-10 pointer-events-none" />
      </section>

      {/* ─── FEATURES SHOWCASE ─── */}
      <section className="relative z-20 max-w-[1400px] mx-auto px-4 md:px-6 py-12 md:py-20 space-y-24 md:space-y-40">
        
        {/* Feature 1: Live Quizzes & Leaderboard */}
        <FeatureRow 
          title="Real-time Live Quizzes"
          description="Host interactive sessions. Switch seamlessly between Student View to answer questions, and Educator View to monitor the live leaderboard as ranks shift instantly."
          icon={<Zap className="w-6 h-6 text-amber-400" />}
        >
          <QuizShowcase />
        </FeatureRow>

        {/* Feature 2: Classroom (Updates & Assignments) */}
        <FeatureRow 
          title="The Connected Classroom"
          description="A centralized hub. Post real-time updates, collect assignments securely, and use the Speed Grader to review submissions and send feedback instantly."
          icon={<Users className="w-6 h-6 text-orange-400" />}
          reverse
        >
          <ClassroomShowcase />
        </FeatureRow>

        {/* Feature 3: Advanced Testing */}
        <FeatureRow 
          title="Rigorous Testing Environment"
          description="Built for serious academia. Schedule strict tests with precise timers, negative marking for incorrect answers, and automatic submission handling."
          icon={<Clock className="w-6 h-6 text-red-400" />}
        >
          <TestShowcase />
        </FeatureRow>

        {/* Feature 4: Results & Analytics */}
        <FeatureRow 
          title="Deep Results Tracking"
          description="Empower both educators and students. Educators can track class-wide performance, while students get detailed breakdowns of their personal scores."
          icon={<LineChart className="w-6 h-6 text-orange-500" />}
          reverse
        >
          <ResultsShowcase />
        </FeatureRow>

      </section>

      {/* ─── CTA FOOTER ─── */}
      <footer className="mt-12 md:mt-20 border-t border-orange-900/20 bg-gradient-to-b from-[#050505] to-red-950/20 pt-20 md:pt-32 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-20 md:pb-24 text-center space-y-6 md:space-y-8">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">Ready to transform <br className="hidden md:block"/> your classroom?</h2>
          <p className="text-lg md:text-xl text-orange-100/60 max-w-2xl mx-auto px-2">Join Arun today and experience the platform built by a student, designed specifically to solve the headaches of modern educators.</p>
          <div className="px-4 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-full px-10 md:px-12 h-14 md:h-16 text-lg md:text-xl font-bold transition-transform hover:scale-105 mt-6 md:mt-8 shadow-[0_0_40px_rgba(239,68,68,0.3)] border-none">
              <Link href="/dashboard">Enter Classroom</Link>
            </Button>
          </div>
        </div>
        <div className="border-t border-orange-900/20 bg-black/50 py-6 md:py-8 text-center text-xs md:text-sm text-orange-200/40 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 relative z-10 px-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-gradient-to-tr from-orange-600 to-red-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
            <span className="font-bold text-orange-100 text-base md:text-lg">Arun</span>
          </div>
          <span className="hidden sm:inline text-orange-500/30">•</span>
          <span>© 2026 Arun Education. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}

// ─── INTERACTIVE SHOWCASE COMPONENTS ───

function QuizShowcase() {
  const [mode, setMode] = useState<"student" | "educator">("student");

  return (
    <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] md:aspect-[16/10] bg-[#0a0a0a] rounded-2xl border border-orange-900/30 overflow-hidden shadow-2xl flex flex-col">
      {/* Top Bar */}
      <div className="flex flex-wrap sm:flex-nowrap justify-between items-center px-3 py-2 sm:px-4 sm:py-3 border-b border-orange-900/20 bg-orange-950/10">
        <div className="flex w-full sm:w-auto gap-1 sm:gap-2 bg-orange-950/30 p-1 rounded-lg border border-orange-900/30">
          <button 
            onClick={() => setMode("student")}
            className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all ${mode === "student" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-orange-200/50 hover:text-orange-200"}`}
          >
            Student
          </button>
          <button 
            onClick={() => setMode("educator")}
            className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all ${mode === "educator" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-orange-200/50 hover:text-orange-200"}`}
          >
            Educator
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-red-400 font-mono text-sm bg-red-950/30 px-3 py-1 rounded-full border border-red-900/30">
          <Clock className="w-3.5 h-3.5" /> 00:45
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-transparent to-orange-950/10">
        {mode === "student" ? (
          <motion.div 
            key="student"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-black/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-orange-500/20 space-y-4 sm:space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-orange-200/50 uppercase tracking-wider">
              <span>Question 3 of 10</span>
              <span className="flex items-center gap-1 text-orange-500"><Users className="w-3.5 h-3.5"/> 42 Live</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">What is the powerhouse of the cell?</h3>
            <div className="space-y-2 sm:space-y-3">
              {["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"].map((opt, i) => (
                <div key={i} className={`p-3 sm:p-4 rounded-xl border font-semibold transition-colors cursor-pointer text-sm sm:text-base ${i === 2 ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'border-orange-900/30 text-orange-100 hover:bg-orange-900/20'}`}>
                  {opt}
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="educator"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-black/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-orange-500/20 space-y-4 sm:space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-2 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2"><Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400"/> Live Leaderboard</h3>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] sm:text-xs">Question 3 Active</Badge>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {[
                { name: "Sarah J.", score: 2800, rank: 1 },
                { name: "Michael T.", score: 2450, rank: 2 },
                { name: "David L.", score: 2100, rank: 3 },
              ].map((student, i) => (
                <div key={i} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-orange-950/20 border border-orange-900/20">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-xl sm:text-2xl font-black text-orange-500/40 w-6 sm:w-8 text-center">{student.rank}</span>
                    <span className="font-bold text-orange-50 text-sm sm:text-base">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-semibold text-orange-400 text-xs sm:text-sm">{student.score} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ClassroomShowcase() {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Updates Panel */}
      <div className="bg-[#0a0a0a] rounded-2xl border border-orange-900/30 p-4 sm:p-5 shadow-2xl flex flex-col h-[300px] sm:h-[350px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-2 mb-4 text-orange-50 font-bold relative z-10">
          <Bell className="w-5 h-5 text-orange-400"/> Recent Updates
        </div>
        <div className="flex-1 space-y-3 sm:space-y-4 overflow-hidden relative z-10">
          <div className="p-3 sm:p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
            <div className="text-[10px] sm:text-xs text-orange-400 font-bold mb-1 uppercase tracking-wider">Dr. Smith • Just now</div>
            <p className="text-xs sm:text-sm text-orange-100/90 font-medium leading-relaxed">The midterm assignment has been posted. Please review the rubric before submitting.</p>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 opacity-60">
            <div className="text-[10px] sm:text-xs text-orange-200/50 font-bold mb-1 uppercase tracking-wider">System • 2 hours ago</div>
            <p className="text-xs sm:text-sm text-orange-100/70">New classroom join code generated: ARUN-X92B</p>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Speed Grader Panel */}
      <div className="bg-[#0a0a0a] rounded-2xl border border-orange-900/30 shadow-2xl overflow-hidden flex flex-col h-[300px] sm:h-[350px]">
        <div className="bg-orange-950/20 p-3 sm:p-4 border-b border-orange-900/20 flex justify-between items-center">
          <span className="font-bold text-orange-50 text-xs sm:text-sm">Speed Grader</span>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] sm:text-xs">12 Pending</Badge>
        </div>
        <div className="p-3 sm:p-4 flex flex-col h-full gap-3 sm:gap-4 relative bg-gradient-to-b from-transparent to-orange-950/10">
          {/* Fake Image Placeholder */}
          <div className="w-full flex-1 rounded-xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-orange-900/20 flex items-center justify-center overflow-hidden relative group">
             {/* Abstract tech/code representation */}
             <div className="absolute inset-0 opacity-[0.03] bg-[url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
             <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent opacity-50" />
             <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500/40 relative z-10 transition-transform group-hover:scale-110" />
          </div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-2"
          >
            <div className="flex-1 bg-black/50 border border-orange-900/30 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm text-orange-200/50 flex items-center font-medium">Great work on the conclusion...</div>
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg px-3 sm:px-4 flex items-center justify-center shadow-lg shadow-red-900/30 cursor-pointer">
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </motion.div>

          {/* Success Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md"
          >
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Feedback Sent
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function TestShowcase() {
  return (
    <div className="w-full aspect-auto sm:aspect-video min-h-[300px] bg-gradient-to-br from-red-950/20 via-[#0a0a0a] to-orange-950/20 rounded-2xl border border-orange-900/30 p-4 sm:p-8 md:p-12 flex flex-col justify-center gap-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 sm:w-80 h-48 sm:h-80 bg-red-600/10 blur-[60px] sm:blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 sm:w-80 h-48 sm:h-80 bg-orange-600/10 blur-[60px] sm:blur-[100px] rounded-full pointer-events-none" />
      
      <Card className="bg-black/60 border-orange-900/30 p-5 sm:p-6 md:p-8 backdrop-blur-xl max-w-2xl mx-auto w-full relative z-10 shadow-2xl shadow-black/80">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-4 mb-6 sm:mb-8">
          <div>
            <h4 className="text-xl sm:text-2xl font-black text-white mb-1">Final Examination</h4>
            <p className="text-sm sm:text-base text-orange-200/60 font-medium">Advanced Algorithms - CS401</p>
          </div>
          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold tracking-widest uppercase">SCHEDULED</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-orange-950/20 p-3 sm:p-4 rounded-xl border border-orange-900/20">
            <span className="text-[10px] sm:text-xs text-orange-500/70 font-bold uppercase tracking-widest block mb-1">Duration</span>
            <span className="text-white font-mono text-lg sm:text-xl">120 Minutes</span>
          </div>
          <div className="bg-red-950/30 p-3 sm:p-4 rounded-xl border border-red-900/30">
            <span className="text-[10px] sm:text-xs text-red-500/70 font-bold uppercase tracking-widest block mb-1">Negative Marking</span>
            <span className="text-red-400 font-bold text-base sm:text-lg">-1 per wrong answer</span>
          </div>
          <div className="bg-orange-950/10 p-3 sm:p-4 rounded-xl border border-orange-900/10 md:col-span-2 flex justify-between items-center">
            <div>
              <span className="text-[10px] sm:text-xs text-orange-500/50 font-bold uppercase tracking-widest block mb-1">Auto-Submission</span>
              <span className="text-orange-100/70 text-xs sm:text-sm font-medium">Test submits automatically when timer ends</span>
            </div>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500/50" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ResultsShowcase() {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Educator Analytics */}
      <div className="bg-[#0a0a0a] rounded-2xl border border-orange-900/30 p-5 sm:p-6 shadow-2xl flex flex-col h-[300px] sm:h-[380px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-orange-900/10 to-transparent pointer-events-none" />
        <div className="mb-4 sm:mb-6 relative z-10">
          <h4 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
            <LineChart className="w-4 h-4 text-orange-500" /> Class Average Trend
          </h4>
          <p className="text-orange-200/50 text-xs sm:text-sm font-medium mt-1">Track overall performance across tests</p>
        </div>
        <div className="flex-1 w-full min-h-0 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockAnalyticsData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#fdba74', opacity: 0.5 }} />
              <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#fdba74', opacity: 0.5 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#050505', borderColor: '#431407', borderRadius: '8px' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="score" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Student Result Card */}
      <div className="bg-[#0a0a0a] rounded-2xl border border-orange-900/30 p-5 sm:p-6 shadow-2xl flex flex-col h-[300px] sm:h-[380px] justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-[#0a0a0a] to-orange-900/20" />
        
        <div className="relative z-10 w-full max-w-sm bg-black/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-orange-500/20 text-center space-y-4 sm:space-y-6 shadow-2xl">
           <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-tr from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center border-2 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
              <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-500">A+</span>
           </div>
           <div>
             <h3 className="text-xl sm:text-2xl font-black text-white mb-1">95 / 100</h3>
             <p className="text-sm sm:text-base text-orange-200/70 font-medium">Midterm Examination</p>
           </div>
           <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t border-orange-900/30 pt-4 sm:pt-6">
              <div className="bg-orange-950/30 p-2 rounded-lg border border-orange-900/20">
                <span className="block text-[10px] sm:text-xs text-orange-500/70 font-bold uppercase tracking-widest mb-1">Correct</span>
                <span className="text-orange-400 font-mono text-base sm:text-lg font-bold">38</span>
              </div>
              <div className="bg-red-950/30 p-2 rounded-lg border border-red-900/20">
                <span className="block text-[10px] sm:text-xs text-red-500/70 font-bold uppercase tracking-widest mb-1">Wrong</span>
                <span className="text-red-400 font-mono text-base sm:text-lg font-bold">2</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// ─── HELPER COMPONENTS ───

function FeatureRow({ title, description, icon, children, reverse = false }: any) {
  return (
    <div className={`flex flex-col gap-10 sm:gap-12 lg:gap-24 items-center ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
      <motion.div 
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex-1 w-full lg:w-auto space-y-4 sm:space-y-6 max-w-xl text-center lg:text-left flex flex-col items-center lg:items-start"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.1)]">
          {icon}
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">{title}</h2>
        <p className="text-base sm:text-lg md:text-xl text-orange-100/60 leading-relaxed font-medium">{description}</p>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="flex-[1.2] w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
