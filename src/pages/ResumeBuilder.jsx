import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import jsPDF from "jspdf";

// --- FIREBASE STORAGE ENGINE IMPORTS ---
import { db, auth } from "../firebase/firebase"; 
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [loading, setLoading] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [fileName, setFileName] = useState("");

  // Extract mode chosen from the Dashboard router matrix
  const selectedMode = location.state?.mode;

  const [buildMode, setBuildMode] = useState(
    selectedMode === "chat" ? "prompt" : "interview"
  );

  // Safely extract existing records passed down from the dashboard router matrix
  const existingResume = location.state?.existingResume;

  const [user, setUser] = useState({
    name: existingResume?.personalInfo?.fullName || "",
    email: existingResume?.personalInfo?.email || "",
    phone: existingResume?.personalInfo?.phone || "",
  });

  const [resume, setResume] = useState({
    summary: existingResume?.summary || "",
    skills: Array.isArray(existingResume?.skills) ? existingResume.skills.join(", ") : existingResume?.skills || "",
    education: existingResume?.education || "",
    experience: existingResume?.experience || "",
  });

  // --- NEW INTUITIVE CHAT MEMORY HOOKS ---
  const chatEndRef = useRef(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { 
      sender: "ai", 
      text: "Hello! I am your collaborative AI recruiter. Instead of filling out rigid forms, just talk to me about your career goals. What professional role or target title are you pursuing, and what are a few things you've worked on recently?" 
    }
  ]);

  // Dynamic Routing State Interceptor (Catches Dashboard Actions)
  useEffect(() => {
    if (existingResume) {
      setBuildMode("prompt");
      setUser({
        name: existingResume.personalInfo?.fullName || "",
        email: existingResume.personalInfo?.email || "",
        phone: existingResume.personalInfo?.phone || "",
      });
      setResume({
        summary: existingResume.summary || "",
        skills: Array.isArray(existingResume.skills) ? existingResume.skills.join(", ") : existingResume.skills || "",
        education: existingResume.education || "",
        experience: existingResume.experience || "",
      });
    }
  }, [existingResume]);

  // Keep chat viewport scrolled down automatically 
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleResumeChange = (field, value) => {
    setResume((prev) => ({ ...prev, [field]: value }));
  };

  // ---------------- STEP 1: DYNAMIC CONVERSATIONAL ENGINE ----------------
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMessage = chatInput.trim();
    const updatedMessages = [...messages, { sender: "user", text: userMessage }];
    
    setMessages(updatedMessages);
    setChatInput("");
    setLoading(true);

    try {
      // Map entire conversation thread to an API-friendly structure for model contextual memory
      const chatContextHistory = updatedMessages.map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text
      }));

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an elite corporate recruiter and a warm, highly encouraging resume co-pilot. 
              Your job is to interview the user naturally. Do NOT output markdown tables, json data, or form structures. 
              Speak passionately and authentically. Validate their wins, acknowledge their experience, and ask natural, intelligent, 1-at-a-time follow-up questions to uncover details about their achievements, technical stacks, tools, or education. Keep your responses short, conversational, and highly engaging.`
            },
            ...chatContextHistory
          ],
          temperature: 0.7, // Higher temp allows for natural, adaptive human personality
        }),
      });

      if (!res.ok) throw new Error("Conversation Node Connection Interrupted.");

      const data = await res.json();
      const aiReply = data?.choices?.[0]?.message?.content || "Tell me more about that!";
      
      setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "ai", text: "My network connection spiked for a second, but I'm here. Can you repeat that last detail?" }]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- STEP 2: HIDDEN BACKGROUND DATA PARSING ENGINE ----------------
  const finalCompileFromChatHistory = async () => {
    setLoading(true);
    setFeedback({ type: null, message: "" });
    
    // Construct a transcript from the natural dialogue stream
    const transcriptString = messages
      .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
      .join("\n");

    try {
      const promptPayload = `Analyze this entire natural chat interview transcript history between our Recruiter and User. Extract and structure the context cleanly into appropriate resume blocks: \n\n${transcriptString}`;
      await executeGroqApiRequest(promptPayload);
      setBuildMode("prompt"); // Take them over to view their beautiful filled-out draft canvas
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Failed parsing deep context stream. Try another message response turn first." });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CLASSIC PROMPT BOX EXECUTION ENGINE ----------------
  const generateAI = async (e) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;
    setLoading(true);
    setFeedback({ type: null, message: "" });

    try {
      await executeGroqApiRequest(aiPromptInput);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const executeGroqApiRequest = async (promptPayload) => {
    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an expert resume writer. You must respond ONLY with a valid JSON object. 
              Do not include any conversational filler outside the JSON payload. 
              The response must strictly match this structure:
              {
                "summary": "3-4 lines professional summary",
                "skills": "skill1, skill2, skill3, skill4",
                "education": "Degree - University - Year",
                "experience": "Job Title - Company - Key Achievements"
              }`,
            },
            { role: "user", content: promptPayload },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const contentText = data?.choices?.[0]?.message?.content || "{}";
    const parsedResume = JSON.parse(contentText);

    setResume({
      summary: parsedResume.summary || "",
      skills: parsedResume.skills || "",
      education: parsedResume.education || "",
      experience: parsedResume.experience || "",
    });

    setFeedback({ type: "success", message: "AI Engine formatting matrix deployed successfully." });
  };

  // ---------------- ADVANCED PDF GENERATOR WITH AUTO-WRAP & FIREBASE CLOUD SYNC ----------------
  const downloadPDF = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setFeedback({ 
        type: "error", 
        message: "Authentication node unverified. You must be signed in to download and sync resumes." 
      });
      return;
    }

    setLoading(true);
    setFeedback({ type: null, message: "" });

    const docPdf = new jsPDF("p", "mm", "a4");
    const pageWidth = docPdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    
    let y = 25;

    const writeSection = (title, text, isHeader = false) => {
      if (isHeader) {
        docPdf.setFont("helvetica", "bold");
        docPdf.setFontSize(18);
        docPdf.text(text, margin, y);
        y += 7;
        return;
      }

      if (title) {
        docPdf.setFont("helvetica", "bold");
        docPdf.setFontSize(12);
        docPdf.text(title, margin, y);
        y += 5;
      }

      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(10);
      
      const splitLines = docPdf.splitTextToSize(text || "", maxLineWidth);
      
      splitLines.forEach((line) => {
        if (y > 280) {
          docPdf.addPage();
          y = 20;
        }
        docPdf.text(line, margin, y);
        y += 6;
      });

      y += 4;
    };

    writeSection(null, user.name || "Your Name", true);
    
    docPdf.setFontSize(10);
    docPdf.setFont("helvetica", "normal");
    if (user.email) { docPdf.text(user.email, margin, y); y += 5; }
    if (user.phone) { docPdf.text(user.phone, margin, y); y += 5; }
    
    docPdf.setDrawColor(200, 200, 200);
    docPdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    if (resume.summary) writeSection("SUMMARY", resume.summary);
    if (resume.skills) writeSection("SKILLS", resume.skills);
    if (resume.education) writeSection("EDUCATION", resume.education);
    if (resume.experience) writeSection("EXPERIENCE", resume.experience);

    // Dynamic filename builder checking for user input
    const baseName = fileName.trim() || user.name || "resume";
    const secureFileName = baseName.replace(/\s+/g, "_");
    docPdf.save(`${secureFileName}.pdf`);

    try {
      const payload = {
        userId: currentUser.uid, 
        type: "resume",
        updatedAt: serverTimestamp(),
        atsScore: existingResume?.atsScore || "85%",
        personalInfo: {
          fullName: user.name || "Untitled Optimized Resume",
          email: user.email || "",
          phone: user.phone || ""
        },
        summary: resume.summary || "",
        skills: resume.skills ? resume.skills.split(",").map(s => s.trim()) : [],
        education: resume.education || "",
        experience: resume.experience || ""
      };

      if (existingResume?.id) {
        await updateDoc(doc(db, "documents", existingResume.id), payload);
        setFeedback({ type: "success", message: "Changes saved and updated inside your cloud hub!" });
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "documents"), payload);
        setFeedback({ type: "success", message: "PDF compiled and saved as a new profile in your cloud hub!" });
      }
    } catch (error) {
      console.error("Firestore Save Sync Failure Exception:", error);
      setFeedback({ 
        type: "error", 
        message: `Asset generated locally, but cloud save failed: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= MAIN APPARATUS INTERFACE WORKSPACE LAYER =================
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans select-none">
      
      {/* HEADER CONTROL BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 pb-6 border-b border-white/5 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate("/dashboard")} className="text-neutral-500 hover:text-white text-xs font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 transition">
              &larr; Dashboard
            </button>
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-500/20">
              {existingResume ? "Resume Edit Mode" : "Resume Creation Mode"}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mt-2">RESUME EDIT</h1>
          <p className="text-sm text-neutral-400">Modify your current records or use the AI co-pilot to optimize sections instantly</p>
        </div>

        <button
          onClick={downloadPDF} disabled={loading}
          className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 active:scale-95 transition px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2"
        >
          <span>{loading ? "Processing Hub Data..." : "📥 Export and Save Changes"}</span>
        </button>
      </div>

      {feedback.type && (
        <div className={`max-w-7xl mx-auto mb-6 p-4 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition ${
          feedback.type === "error" ? "bg-red-950/20 border-red-500/20 text-red-400" : "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
        }`}>
          <span>{feedback.type === "error" ? "⚠️" : "⚡"}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TWO-COLUMN SIDE-BY-SIDE WORKING LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
        
        {/* LEFT PANEL: SMART CHAT ENGINE VS PROMPT EXECUTER */}
        <div className="lg:col-span-5 space-y-6">
          
          {buildMode === "interview" ? (
            /* CONVERSATIONAL MEMORY CHAT HUB PANEL UI */
            <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-xl flex flex-col h-[550px]">
              <div className="pb-4 border-b border-white/5 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-cyan-400 animate-pulse">🎙️</span> Intelligent Recruiter Co-pilot
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-light mt-0.5">Chat freely. Say as much or as little as you want.</p>
                </div>
                
                {/* INJECTED COMPILATION ACTION INTERFACE TRIGGER */}
                <button
                  type="button"
                  onClick={finalCompileFromChatHistory}
                  disabled={loading || messages.length < 2}
                  className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:from-neutral-900 disabled:to-neutral-900 text-white font-black text-[10px] tracking-wider uppercase px-3 py-2 rounded-xl shadow-md transition"
                >
                  ✨ Generate Resume Draft
                </button>
              </div>

              {/* Chat Thread Panel Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin text-xs leading-relaxed">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.sender === "user" 
                        ? "bg-cyan-600 text-white rounded-tr-none" 
                        : "bg-[#111] border border-white/5 text-neutral-200 rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-[#111] border border-white/5 p-3 rounded-2xl rounded-tl-none text-neutral-500 italic">
                      AI is evaluating career context parameters...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Operational Input Panel form */}
              <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
                <input
                  type="text" value={chatInput} disabled={loading}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={loading ? "Analyzing conversation metrics..." : "Reply naturally (e.g. 'I used Python to optimize query performance... ')"}
                  className="flex-1 bg-[#111] border border-white/5 focus:border-cyan-500/40 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 outline-none transition shadow-inner"
                />
                <button
                  type="submit" disabled={loading || !chatInput.trim()}
                  className="bg-cyan-600 text-white font-bold text-[10px] tracking-wider uppercase px-4 py-3 rounded-xl transition disabled:bg-neutral-900 disabled:text-neutral-600"
                >
                  Send
                </button>
              </form>
            </div>
          ) : (
            /* ORIGINAL DEDICATED MANUAL TEXT PROMPT ENGINE BOX */
            <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-cyan-400">⚡</span> AI Blueprint Co-pilot
                </h3>
                <p className="text-xs text-neutral-400 mt-1 font-light leading-relaxed">
                  Describe target metrics, project lifecycles, or stack components below to draft clean records.
                </p>
              </div>
              
              <form onSubmit={generateAI} className="space-y-4">
                <textarea
                  value={aiPromptInput} onChange={(e) => setAiPromptInput(e.target.value)} rows={4}
                  placeholder="Example: I'm a software engineer with 3 years of React experience. I graduated from tech university in 2024 and optimized database speeds by 40%..."
                  className="w-full bg-[#111] border border-white/5 focus:border-cyan-500/40 rounded-xl p-4 text-sm text-white placeholder-neutral-600 outline-none transition resize-none leading-relaxed shadow-inner"
                />
                <button
                  type="submit" disabled={loading || !aiPromptInput.trim()}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-900 disabled:text-neutral-600 active:scale-[0.99] font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition duration-150 shadow-md"
                >
                  {loading ? "Rebuilding Document Tree..." : "Execute AI Parsing Engine"}
                </button>
              </form>
            </div>
          )}

          {/* PERSONAL INFO IDENTITY FIELDS */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 pb-2 border-b border-white/5">
              Contact Matrix Parameters
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block ml-1">Full Identity Name</label>
              <input
                type="text" placeholder="John Doe" value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="p-4 bg-[#111] border border-white/5 focus:border-cyan-500/40 rounded-xl outline-none text-sm transition text-white placeholder-neutral-700 shadow-inner"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block ml-1">Email Node Address</label>
                <input
                  type="email" placeholder="johndoe@example.com" value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="p-4 bg-[#111] border border-white/5 focus:border-cyan-500/40 rounded-xl outline-none text-sm transition text-white placeholder-neutral-700 shadow-inner"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block ml-1">Phone String</label>
                <input
                  type="tel" placeholder="+1 (555) 000-0000" value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  className="p-4 bg-[#111] border border-white/5 focus:border-cyan-500/40 rounded-xl outline-none text-sm transition text-white placeholder-neutral-700 shadow-inner"
                />
              </div>
            </div>
            {/* NEW EXPORT FILE NAME STRING INTERFACE */}
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block ml-1">Custom Export PDF File Name</label>
              <input
                type="text" 
                placeholder="e.g. My_Software_Engineer_Resume" 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="p-4 bg-[#111] border border-emerald-500/20 focus:border-emerald-500/50 rounded-xl outline-none text-sm transition text-white placeholder-neutral-700 shadow-inner"
              />
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: LIVE WRAPPED A4 SHEET DOCUMENT PREVIEW */}
        <div className="lg:col-span-7">
          <div className="bg-white text-neutral-900 p-12 shadow-2xl rounded-3xl w-full min-h-[842px] border border-neutral-200 transition relative">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-t-3xl" />

            <div className="border-b-2 border-neutral-200 pb-5 mb-8">
              <h1 className="text-4xl font-black tracking-tight text-neutral-900 min-h-[44px]">
                {user.name || <span className="text-neutral-300 font-light italic">Your Name Blueprint</span>}
              </h1>
              <div className="text-xs font-mono text-neutral-500 flex flex-wrap gap-x-4 mt-2 min-h-[20px]">
                {user.email && <span>{user.email}</span>}
                {user.phone && <span>• {user.phone}</span>}
              </div>
            </div>

            {[
              { key: "summary", label: "Professional Summary Block" },
              { key: "skills", label: "Skills & Core Competencies" },
              { key: "education", label: "Institutional Education History" },
              { key: "experience", label: "Professional Deployment Experience" },
            ].map((section) => (
              <div key={section.key} className="mb-6 group relative p-3 -mx-3 rounded-xl hover:bg-neutral-50 transition duration-150">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-[11px] font-black text-cyan-700 tracking-widest uppercase">
                    {section.label}
                  </h2>
                  <span className="text-[9px] text-neutral-400 font-mono opacity-0 group-hover:opacity-100 transition">Editable Area</span>
                </div>
                <textarea
                  rows={section.key === "summary" || section.key === "experience" ? 4 : 2}
                  value={resume[section.key]}
                  onChange={(e) => handleResumeChange(section.key, e.target.value)}
                  placeholder={`Populate fields via left AI control station or insert custom notes natively...`}
                  className="w-full bg-transparent p-1 text-sm text-neutral-800 outline-none transition resize-none leading-relaxed placeholder-neutral-300 font-normal focus:bg-white focus:ring-1 focus:ring-neutral-200 rounded-lg"
                />
              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}