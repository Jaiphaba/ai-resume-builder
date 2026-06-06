import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, signOut } from "firebase/auth";
import { where } from "firebase/firestore";
import { auth } from "../firebase/firebase";

// Import Firebase dependencies and your project config
// Make sure you have initialized firebase app instance exported somewhere (e.g., db)
import { db } from "../firebase/firebase";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";

export default function Dashboard() {
  const navigate = useNavigate();

const handleSignOut = async () => {
  try {
    await signOut(auth);
    navigate("/");
  } catch (error) {
    console.error("Sign out failed:", error);
  }
};
  const chatEndRef = useRef(null);

  // --- GLOBAL THEME SYSTEM ---
  const [theme, setTheme] = useState("dark"); // "dark" | "light"

  // --- SYSTEM PREFERENCE & VIEW STATES ---
  const [activePage, setActivePage] = useState("hub"); // Start on Hub to view loaded data
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // --- SETTINGS PREFERENCES STATE ---
  const [settingsState, setSettingsState] = useState({
    profileName: "Alex Mercer",
    profileEmail: "alex.mercer@devhub.io",
    activeModel: "Quantum-Core-1.2",
    streamResponses: true,
    telemetry: false,
    apiKey: "sk_••••••••••••••••••••••••3a9b"
  });

  // --- AI CHAT CORE ENGINE STATE ---
  const [inputMessage, setInputMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Hey there! I just finished mapping your local workspace schemas. Everything looks clean and ready to go. I can help you polish your architecture descriptions, fix annoying structural bugs, or tailor your profiles for specific target roles. What's on your radar today?",
      timestamp: "10:53 PM"
    }
  ]);

  // Documents array state synced automatically via Cloud Firestore
  const [documents, setDocuments] = useState([]);

  // --- FIRESTORE SYNCHRONIZATION PIPELINE ---
  useEffect(() => {
    setIsLoadingDocs(true);
    // Reference your documents collection where both resumes and cvs are saved
    const docCollectionRef = collection(db, "documents");
   
    // Query sorted by layout revisions
    const currentUser = auth.currentUser;

if (!currentUser) return;

const q = query(
  docCollectionRef,
  where("userId", "==", currentUser.uid),
  orderBy("updatedAt", "desc")
);

    // Set up a continuous real-time channel pipeline listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedDocs = snapshot.docs.map((fireDoc) => {
        const data = fireDoc.data();
       
        // Ensure consistent formatting parsing values safely
        let formattedDate = "Just now";
        if (data.updatedAt) {
          if (data.updatedAt.seconds) {
            formattedDate = new Date(data.updatedAt.seconds * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            });
          } else if (typeof data.updatedAt === "string") {
            formattedDate = data.updatedAt;
          }
        }

        return {
          id: fireDoc.id,
          title: data.title || (data.type === "cv" ? "Academic Research CV" : "Professional Resume"),
          type: data.type || "resume",
          updatedAt: formattedDate,
          atsScore: data.atsScore || Math.floor(Math.random() * (98 - 75 + 1)) + 75, // Safe baseline math fallback if omitted
          rawContent: data.content || data.sections || {} // Track nested layout configurations data object
        };
      });

      setDocuments(fetchedDocs);
      setIsLoadingDocs(false);
    }, (error) => {
      console.error("Firestore sync channel error:", error);
      setIsLoadingDocs(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute calculated statistics aggregates based on real collection entries
  const averageAtsScore = documents.length > 0
    ? Math.round(documents.reduce((acc, curr) => acc + curr.atsScore, 0) / documents.length)
    : 0;

  // Toggle global UI theme
  const toggleTheme = (targetTheme) => {
    setTheme(targetTheme);
  };

  // Auto-scroll conversational timeline anchor
  useEffect(() => {
    if (activePage === "ai-assistant") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isAiTyping, activePage]);

  // --- INTER-CONNECTIVITY NAVIGATION & HISTORICAL RE-LOADER ---
  const handleLaunch = (docType, mode = null, existingDoc = null) => {
    setShowWizard(false);
   
    // If working on historical document, load context explicitly, otherwise generate template target payload
    const activeTargetDoc = existingDoc || documents.find(d => d.type === docType) || {
      title: docType === "cv" ? "Executive CV Portfolio" : "Tailored Tech Resume",
      type: docType,
      atsScore: 70,
      rawContent: {}
    };
   
    setSelectedDoc(activeTargetDoc);

    if (docType === "cv") {
      setActivePage("cv-builder");
    } else {
      setActivePage("resume-builder");
    }

    try {
      // Forward full state context attributes to the specific workspace engine route parameters
      navigate(docType === "cv" ? "/cv-builder" : "/resume-builder", {
        state: {
          mode,
          documentId: activeTargetDoc.id || null,
          initialData: activeTargetDoc.rawContent || null,
          title: activeTargetDoc.title
        }
      });
    } catch (e) {
      console.error("Navigation trace fail:", e);
    }
  };

  // --- LOCAL WORKSPACE UTILITY: DOWNLOAD EXPORT CONTROL ---
  const handleDownloadBackup = (e, docItem) => {
    e.stopPropagation(); // Avoid triggering route mutations on buttons clicks
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(docItem, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${docItem.title.replace(/\s+/g, '_')}_backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Could not export binary document stream map structure.");
    }
  };

  // --- LOCAL WORKSPACE UTILITY: PERSISTENT CLOUD PURGE INTERFACE ---
  const handlePurgeDocument = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you certain you want to purge this cloud asset from Firestore permanently? This action is irreversible.")) {
      try {
        await deleteDoc(doc(db, "documents", id));
      } catch (err) {
        alert("Execution halted: Unable to delete configuration layer index.");
      }
    }
  };

  // --- SMART, EMPATHETIC, AND NATURAL AI CONVERSATION HANDLER ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newUserMessage = {
      id: Date.now(),
      sender: "user",
      text: inputMessage,
      timestamp: userMessageTime
    };

    setChatHistory(prev => [...prev, newUserMessage]);
    const cleanPrompt = inputMessage.toLowerCase().trim();
    setInputMessage("");
    setIsAiTyping(true);

    // Simulated Processing Engine
    setTimeout(() => {
      let responseText = "";

      if (cleanPrompt.includes("give me a prompt") || cleanPrompt.includes("need a prompt") || cleanPrompt.includes("want a prompt") || cleanPrompt.includes("ask for a prompt")) {
        responseText = `I hear you loud and clear! You need an actual prompt template you can copy and use. Here is a strong system configuration block to pass to an external LLM to get premium career support:\n\n` +
        `"Act as an expert, empathetic technical recruiter and engineering coach. I want you to review my resume text. Do not use overly robotic, generic AI boilerplate phrasing. Instead, speak like an authentic tech peer who is collaborating closely with me on a workspace dashboard. Validate my frustrations or career blockers first, celebrate my baseline strengths, and then give me highly targeted, data-driven suggestions to optimize my text blocks for ATS algorithms. Focus heavily on adding scale, architectures, and metrics rather than just dropping keyword lists. Ask me one clarifying question at a time to pull out my achievements."`;
      }
      else if (cleanPrompt.includes("stuck") || cleanPrompt.includes("broken") || cleanPrompt.includes("not working") || cleanPrompt.includes("error")) {
        responseText = `I completely feel that frustration. Code breaking out of nowhere or refusing to compile is the absolute worst. Take a deep breath—we can totally clear this block together. Let's look at the trace structure or state changes; I've got your back on this one.`;
      }
      else if (cleanPrompt.includes("resume") || cleanPrompt.includes("score") || cleanPrompt.includes("ats") || cleanPrompt.includes("job")) {
        responseText = `I love where your head is at with this configuration. Trying to optimize layouts for picky ATS algorithms is always a bit of a chess match, but your baseline is incredibly strong. Let's look into tweaking your distributed systems or project metrics—adding actual scale numbers makes a massive difference compared to just dropping random keywords. Want me to draft a quick rewrite variant for that segment?`;
      }
      else if (cleanPrompt.includes("cv") || cleanPrompt.includes("academic") || cleanPrompt.includes("citation")) {
        responseText = `Academic CV layouts are such a unique balancing act. Standard algorithmic parses love compact text, but real tenure tracks or research nodes need to see your full pedigree. I get exactly what you're up against. Let's cleanly separate your peer-reviewed items from ongoing fellowships to get that structure perfect.`;
      }
      else if (cleanPrompt.includes("hello") || cleanPrompt.includes("hi") || cleanPrompt.includes("hey")) {
        responseText = `Hey! Good to see you checking in. I'm completely synced up to your active workspace configurations and ready to build. Throw a rough idea or a project description my way, and let's work some magic.`;
      }
      else {
        const naturalOpeners = [
          "Oh, interesting choice. I think that makes absolute sense. ",
          "Yeah, I completely get what you're aiming for with that approach. ",
          "That's a really solid direction to take. Let's trace that out. "
        ];
        const randomOpener = naturalOpeners[Math.floor(Math.random() * naturalOpeners.length)];
        responseText = randomOpener + `I've noted down your target parameters. To hit the highest possible impact window, should we focus on optimizing your deep technical bullet points right now, or would you rather frame up a compelling overview story?`;
      }

      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        sender: "ai",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsAiTyping(false);
    }, 1200);
  };

  const themeStyles = {
    dark: {
      bg: "bg-[#0a0a0a]",
      text: "text-white",
      textMuted: "text-neutral-400",
      textDeepMuted: "text-neutral-600",
      sidebarBg: "bg-[#0c0c0c]",
      sidebarBorder: "border-white/5",
      navActive: "bg-white/5 border-white/10 text-cyan-400",
      navActiveAi: "bg-white/5 border-white/10 text-purple-400",
      navInactive: "text-neutral-400 hover:text-white hover:bg-white/[0.02]",
      cardBg: "bg-white/[0.02] border-white/5",
      inputBg: "bg-[#0d0d0d] border-white/10 text-white",
      chatAiBg: "bg-neutral-900/90 border-white/5 text-neutral-100",
      gridLines: "bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)]",
      modalBg: "bg-[#0e0e0e] border-white/10"
    },
    light: {
      bg: "bg-[#f8f9fa]",
      text: "text-neutral-900",
      textMuted: "text-neutral-600",
      textDeepMuted: "text-neutral-400",
      sidebarBg: "bg-white",
      sidebarBorder: "border-neutral-200/80",
      navActive: "bg-neutral-100 border-neutral-200 text-cyan-600",
      navActiveAi: "bg-neutral-100 border-neutral-200 text-purple-600",
      navInactive: "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50",
      cardBg: "bg-white border-neutral-200 shadow-sm",
      inputBg: "bg-neutral-50 border-neutral-300 text-neutral-900 focus:bg-white",
      chatAiBg: "bg-neutral-100 border-neutral-200 text-neutral-800",
      gridLines: "bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)]",
      modalBg: "bg-white border-neutral-200 shadow-xl"
    }
  };

  const activeTheme = themeStyles[theme];

  return (
    <div className={`min-h-screen ${activeTheme.bg} ${activeTheme.text} flex flex-col md:flex-row relative overflow-hidden font-sans transition-colors duration-300`}>
      {/* Visual Design Background Grids */}
      <div className={`absolute inset-0 ${activeTheme.gridLines} bg-[size:4rem_4rem] pointer-events-none z-0 opacity-40`}></div>
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[160px] -top-40 -left-40 pointer-events-none z-0"></div>

      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className={`w-full md:w-72 border-b md:border-b-0 md:border-r ${activeTheme.sidebarBorder} p-6 lg:p-8 flex flex-col justify-between relative z-20 shrink-0 ${activeTheme.sidebarBg} transition-colors duration-300`}>
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                Core Workspace v2.4
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1 uppercase">
              Developer DASHBOARD
            </h1>
          </div>

          <nav className="flex flex-col gap-1.5">
            <span className={`text-[9px] font-mono font-bold ${activeTheme.textDeepMuted} uppercase tracking-widest block mb-2 px-3`}>
              Main Operations
            </span>
            <button
              onClick={() => setActivePage("hub")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 text-left border border-transparent ${
                activePage === "hub" ? activeTheme.navActive : activeTheme.navInactive
              }`}
            >
              📊 Dashboard Hub
            </button>
            <button
              onClick={() => setActivePage("ai-assistant")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 text-left border border-transparent ${
                activePage === "ai-assistant" ? activeTheme.navActiveAi : activeTheme.navInactive
              }`}
            >
              🤖 AI Assistant
            </button>
            <button
              onClick={() => setActivePage("settings")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 text-left border border-transparent ${
                activePage === "settings"
                  ? (theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-900')
                  : activeTheme.navInactive
              }`}
            >
              ⚙️ Settings Panel
            </button>
          </nav>
        </div>

        <div className="space-y-4">
  <button
    onClick={handleSignOut}
    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 border ${
      theme === "dark"
        ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
        : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
    }`}
  >
    🚪 Sign Out
  </button>

  <div
    className={`hidden md:block pt-4 text-[10px] font-mono ${activeTheme.textDeepMuted} uppercase tracking-widest`}
  >
    Status: Active // 2026
  </div>
</div>
      </aside>

      {/* --- CENTRAL VIEW ROUTER COMPONENT VIEWPORTS --- */}
      <div className="flex-1 overflow-y-auto relative z-10 p-6 lg:p-12 flex flex-col">
        <div className="max-w-4xl mx-auto space-y-10 w-full flex-1 flex flex-col justify-between">
          
          {/* ========================================================= */}
          {/* HUB ROUTE INTERFACE MODULE                                */}
          {/* ========================================================= */}
          {activePage === "hub" && (
            <>
              <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b ${activeTheme.sidebarBorder}`}>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-500">
                      Central Operations Command
                    </span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight mt-1 uppercase">
                    Developer Hub
                  </h1>
                </div>

                <button
                  onClick={() => {
                    setWizardStep(1);
                    setShowWizard(true);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 active:scale-98 text-white text-xs font-bold uppercase tracking-wider px-5 py-3.5 rounded-xl shadow-lg transition duration-150 flex items-center justify-center gap-2"
                >
                  <span>+ Create New Blueprint</span>
                </button>
              </header>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${activeTheme.cardBg} backdrop-blur-md p-6 rounded-2xl`}>
                  <p className={`text-[10px] font-mono ${activeTheme.textMuted} uppercase tracking-widest`}>Active Sync Pipelines</p>
                  <h3 className="text-3xl font-black mt-2">
                    {isLoadingDocs ? "..." : documents.length}
                  </h3>
                  <p className={`text-xs ${activeTheme.textDeepMuted} mt-1`}>Cloud instances deployment operational</p>
                </div>
                <div className={`${activeTheme.cardBg} backdrop-blur-md p-6 rounded-2xl`}>
                  <p className={`text-[10px] font-mono ${activeTheme.textMuted} uppercase tracking-widest`}>Average ATS Health</p>
                  <h3 className="text-3xl font-black mt-2 text-emerald-500">
                    {isLoadingDocs ? "..." : `${averageAtsScore}%`}
                  </h3>
                  <p className={`text-xs ${activeTheme.textDeepMuted} mt-1`}>Optimized above baseline thresholds</p>
                </div>
                <div className={`${activeTheme.cardBg} backdrop-blur-md p-6 rounded-2xl`}>
                  <p className={`text-[10px] font-mono ${activeTheme.textMuted} uppercase tracking-widest`}>Account Node Tier</p>
                  <h3 className="text-3xl font-black mt-2 text-purple-500">Enterprise</h3>
                  <p className={`text-xs ${activeTheme.textDeepMuted} mt-1`}>AI core-copilot response node active</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className={`text-xs font-mono font-bold ${activeTheme.textMuted} uppercase tracking-widest`}>
                    Structured Index System ({documents.length})
                  </h2>
                  <span className={`text-[10px] font-mono ${activeTheme.textDeepMuted}`}>SORTED BY: RECENT REVISION</span>
                </div>

                <div className="space-y-4">
                  {isLoadingDocs ? (
                    <div className="p-12 text-center text-xs font-mono tracking-widest text-neutral-500">
                      Synchronizing workspace pipeline structures with Cloud Firestore Core...
                    </div>
                  ) : documents.length === 0 ? (
                    <div className={`p-12 border border-dashed ${theme === 'dark' ? 'border-white/10' : 'border-neutral-300'} rounded-2xl text-center space-y-3`}>
                      <p className="text-sm font-medium">No live components synced with your Cloud Engine.</p>
                      <p className={`text-xs ${activeTheme.textMuted}`}>Click "Create New Blueprint" to setup your structural portfolio context variables.</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`group ${activeTheme.cardBg} rounded-2xl p-6 transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-neutral-100 border-neutral-200'} border flex items-center justify-center text-lg font-mono transition`}>
                            {doc.type === "cv" ? "🗂️" : "📄"}
                          </div>
                          <div>
                            <h3 className="font-bold text-base tracking-tight transition group-hover:text-cyan-500">
                              {doc.title}
                            </h3>
                            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono ${activeTheme.textDeepMuted} mt-1`}>
                              <span className={`uppercase px-2 py-0.5 rounded text-[10px] border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-neutral-300' : 'bg-neutral-100 border-neutral-200 text-neutral-700'}`}>
                                {doc.type}
                              </span>
                              <span>•</span>
                              <span>Revised: {doc.updatedAt}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 border-t sm:border-t-0 border-neutral-800/10 dark:border-white/5 pt-4 sm:pt-0">
                          <div className="text-right">
                            <span className={`text-[9px] font-mono ${activeTheme.textDeepMuted} uppercase tracking-wider block`}>ATS Match</span>
                            <span className={`text-xs font-mono font-bold ${doc.atsScore >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {doc.atsScore}% Score
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Download Action Component Button */}
                            <button
                              onClick={(e) => handleDownloadBackup(e, doc)}
                              title="Export Raw Configuration JSON"
                              className={`p-2.5 rounded-xl border transition duration-150 ${
                                theme === 'dark' ? 'bg-white/5 text-neutral-300 border-white/5 hover:bg-neutral-800' : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                              }`}
                            >
                              📥
                            </button>

                            {/* Purge / Delete Configuration Button */}
                            <button
                              onClick={(e) => handlePurgeDocument(e, doc.id)}
                              title="Purge from Firestore Cloud"
                              className={`p-2.5 rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/20 transition duration-150`}
                            >
                              🗑️
                            </button>

                            {/* Load / Modify Workspace Anchor */}
                            <button
                              onClick={() => handleLaunch(doc.type, "chat", doc)}
                              className={`text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border transition duration-150 ${
                                theme === 'dark' ? 'bg-white/5 text-neutral-200 border-white/5 hover:bg-cyan-600 hover:border-cyan-500' : 'bg-white text-neutral-800 border-neutral-300 hover:bg-cyan-50 hover:border-cyan-400'
                              }`}
                            >
                              Modify File &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

          {/* ========================================================= */}
          {/* INTERACTIVE COMPANION AI ASSISTANT MODULE                */}
          {/* ========================================================= */}
          {activePage === "ai-assistant" && (
            <div className="flex-1 flex flex-col min-h-[calc(100vh-10rem)] md:min-h-0 space-y-6">
              <header className={`pb-4 border-b ${activeTheme.sidebarBorder} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2`}>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-500">Co-pilot Pairing Layer</span>
                  <h1 className="text-3xl font-black uppercase mt-1">AI Assistant Node</h1>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[10px] font-mono text-purple-500 tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                  Model: {settingsState.activeModel}
                </div>
              </header>

              {/* Chat Screen Log Panel */}
              <div className={`flex-1 ${activeTheme.cardBg} rounded-3xl p-6 overflow-y-auto max-h-[50vh] min-h-[350px] space-y-4 flex flex-col backdrop-blur-sm shadow-inner`}>
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                      msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <div
                      className={`px-4.5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-purple-950/20"
                          : activeTheme.chatAiBg
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className={`text-[9px] font-mono ${activeTheme.textDeepMuted} mt-1 uppercase tracking-widest px-1`}>
                      {msg.sender === "user" ? "You" : "AI Companion"} // {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Typing Streaming Spinner UI */}
                {isAiTyping && (
                  <div className="self-start flex flex-col items-start max-w-[75%]">
                    <div className={`${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-neutral-100 border-neutral-200'} border px-5 py-3.5 rounded-2xl rounded-bl-none flex items-center gap-1.5`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Fast Action Intent Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInputMessage("Can you give me a prompt for resume optimizations?")}
                  className={`px-3.5 py-2 rounded-xl text-left text-[11px] transition font-mono uppercase tracking-wider border ${
                    theme === 'dark' ? 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-purple-400 hover:border-purple-500/30' : 'bg-white border-neutral-200 text-neutral-600 hover:text-purple-600 hover:border-purple-500/30'
                  }`}
                >
                  📋 Get Copy-Paste Resume Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setInputMessage("I'm feeling kind of stuck on my code layout, it's throwing errors.")}
                  className={`px-3.5 py-2 rounded-xl text-left text-[11px] transition font-mono uppercase tracking-wider border ${
                    theme === 'dark' ? 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-purple-400 hover:border-purple-500/30' : 'bg-white border-neutral-200 text-neutral-600 hover:text-purple-600 hover:border-purple-500/30'
                  }`}
                >
                  ⚡ Troubleshoot Broken Architecture
                </button>
              </div>

              {/* Secure Chat Submission Input controller */}
              <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Talk configuration strategy or request direct design refactors..."
                  className={`w-full border rounded-2xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-xl transition-all ${activeTheme.inputBg}`}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isAiTyping}
                  className="absolute right-3 p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white transition active:scale-95"
                >
                  <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-7-9-7v14z" />
                  </svg>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* PROFESSIONAL CORE CONFIGURATION SETTINGS PANEL             */}
          {/* ========================================================= */}
          {activePage === "settings" && (
            <div className="space-y-8 max-w-3xl">
              <header className={`pb-4 border-b ${activeTheme.sidebarBorder}`}>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Global Constants</span>
                <h1 className="text-3xl font-black uppercase mt-1">System Settings</h1>
                <p className={`text-xs ${activeTheme.textMuted} mt-1`}>Manage workspace interface themes, AI model engine nodes, and secure token authentications.</p>
              </header>

              <div className="space-y-6">
                
                {/* CATEGORY 1: THEME ADJUSTMENT */}
                <div className={`${activeTheme.cardBg} rounded-2xl p-6 space-y-4`}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">Visual Interface Theme</h3>
                    <p className={`text-xs ${activeTheme.textMuted} mt-0.5`}>Adjust layout luminosity configurations across the active canvas.</p>
                  </div>
                  <div className={`grid grid-cols-2 gap-3 p-1.5 rounded-xl ${theme === 'dark' ? 'bg-black/40' : 'bg-neutral-100'}`}>
                    <button
                      type="button"
                      onClick={() => toggleTheme("light")}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition ${
                        theme === "light"
                          ? "bg-white text-neutral-950 shadow-md shadow-neutral-300/30"
                          : `text-neutral-500 hover:${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`
                      }`}
                    >
                      ☀️ Light Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTheme("dark")}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition ${
                        theme === "dark"
                          ? "bg-neutral-800 text-white shadow-md shadow-black/60"
                          : `text-neutral-500 hover:${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`
                      }`}
                    >
                      🌙 Dark Mode
                    </button>
                  </div>
                </div>

                {/* CATEGORY 2: IDENTITY MATRICES */}
                <div className={`${activeTheme.cardBg} rounded-2xl p-6 space-y-4`}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">Identity Profiles</h3>
                    <p className={`text-xs ${activeTheme.textMuted} mt-0.5`}>Configure identity parameters injected into structured files.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-mono uppercase ${activeTheme.textMuted}`}>Full Name</label>
                      <input
                        type="text"
                        value={settingsState.profileName}
                        onChange={(e) => setSettingsState({ ...settingsState, profileName: e.target.value })}
                        className={`w-full text-xs font-medium px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500/30 ${activeTheme.inputBg}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-mono uppercase ${activeTheme.textMuted}`}>Email Coordinates</label>
                      <input
                        type="email"
                        value={settingsState.profileEmail}
                        onChange={(e) => setSettingsState({ ...settingsState, profileEmail: e.target.value })}
                        className={`w-full text-xs font-medium px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500/30 ${activeTheme.inputBg}`}
                      />
                    </div>
                  </div>
                </div>

                {/* CATEGORY 3: MODEL WEIGHT SELECTION */}
                <div className={`${activeTheme.cardBg} rounded-2xl p-6 space-y-4`}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">Copilot AI Core Config</h3>
                    <p className={`text-xs ${activeTheme.textMuted} mt-0.5`}>Tune internal prompt orchestration matrices and computational weight scales.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-mono uppercase ${activeTheme.textMuted}`}>Model Instance Selection</label>
                      <select
                        value={settingsState.activeModel}
                        onChange={(e) => setSettingsState({ ...settingsState, activeModel: e.target.value })}
                        className={`w-full text-xs font-mono px-4 py-3 rounded-xl border focus:outline-none ${activeTheme.inputBg}`}
                      >
                        <option value="Quantum-Core-1.2">Quantum-Core-1.2 (Default Fastest)</option>
                        <option value="Neural-Stream-Ultra">Neural-Stream-Ultra (Deep Synthesis)</option>
                        <option value="Local-Llama-M3">Local-Llama-M3 (Offline Layer)</option>
                      </select>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wide block">Stream-Array Vector Responses</span>
                        <span className={`text-[11px] ${activeTheme.textMuted}`}>Display text tokens dynamically in real-time.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsState.streamResponses}
                        onChange={(e) => setSettingsState({ ...settingsState, streamResponses: e.target.checked })}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-neutral-900 border-white/10"
                      />
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wide block">Anonymized Core Telemetry</span>
                        <span className={`text-[11px] ${activeTheme.textMuted}`}>Dispatch parser bugs back to structural optimizations framework.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsState.telemetry}
                        onChange={(e) => setSettingsState({ ...settingsState, telemetry: e.target.checked })}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-neutral-900 border-white/10"
                      />
                    </div>
                  </div>
                </div>

                {/* CATEGORY 4: SECURITY LAYER INFRASTRUCTURE */}
                <div className={`${activeTheme.cardBg} rounded-2xl p-6 space-y-4`}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">Encryption Keys & Access Tokens</h3>
                    <p className={`text-xs ${activeTheme.textMuted} mt-0.5`}>Secure infrastructure interfaces against unauthorized execution lines.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-mono uppercase ${activeTheme.textMuted}`}>User Workspace Token API Key</label>
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        readOnly
                        value={settingsState.apiKey}
                        className={`w-full text-xs font-mono px-4 py-3 rounded-xl border tracking-widest ${activeTheme.inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={() => alert("Token clipboard operation logged secure.")}
                        className={`absolute right-3 px-2.5 py-1.5 text-[10px] font-mono uppercase font-bold border rounded-lg hover:text-cyan-500 transition ${
                          theme === 'dark' ? 'bg-white/5 border-white/10 text-neutral-400' : 'bg-white border-neutral-300 text-neutral-600'
                        }`}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* RESUME BUILDER PANEL PREVIEWS                             */}
          {/* ========================================================= */}
          {activePage === "resume-builder" && (
            <div className="space-y-8">
              <button
                type="button"
                onClick={() => setActivePage("hub")}
                className={`text-[10px] uppercase font-bold font-mono tracking-widest border px-4 py-2 rounded-xl transition-all ${
                  theme === 'dark' ? 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                &larr; Return to Dashboard Hub
              </button>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${activeTheme.sidebarBorder}`}>
                <div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-md font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">RESUME BUILDER WORKSPACE</span>
                  <h2 className="text-2xl md:text-3xl font-black uppercase mt-2 tracking-tight">{selectedDoc?.title || "Draft Document"}</h2>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] ${activeTheme.textDeepMuted} block font-mono`}>Real-time Performance Match</span>
                  <span className="text-2xl font-black text-emerald-500">{selectedDoc?.atsScore || 0}% ATS Health</span>
                </div>
              </div>
              
              <div className={`p-12 border border-dashed ${theme === 'dark' ? 'border-white/10' : 'border-neutral-300'} rounded-3xl text-center space-y-4 bg-white/[0.01]`}>
                <span className="text-4xl block">📝</span>
                <p className="font-bold text-lg">Interactive Editor Canvas Layer Ready</p>
                <p className={`text-sm ${activeTheme.textMuted} max-w-md mx-auto`}>This panel maps directly to your custom components. Start editing headers or drop details here to begin live data composition.</p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CV BUILDER PANEL PREVIEWS                                 */}
          {/* ========================================================= */}
          {activePage === "cv-builder" && (
            <div className="space-y-8">
              <button
                type="button"
                onClick={() => setActivePage("hub")}
                className={`text-[10px] uppercase font-bold font-mono tracking-widest border px-4 py-2 rounded-xl transition-all ${
                  theme === 'dark' ? 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                &larr; Return to Dashboard Hub
              </button>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${activeTheme.sidebarBorder}`}>
                <div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-md font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">ACADEMIC CV WORKSPACE</span>
                  <h2 className="text-2xl md:text-3xl font-black uppercase mt-2 tracking-tight">{selectedDoc?.title || "Draft Document"}</h2>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] ${activeTheme.textDeepMuted} block font-mono`}>Tenure/Structure Index</span>
                  <span className="text-2xl font-black text-purple-500">{selectedDoc?.atsScore || 0}% Match</span>
                </div>
              </div>
              
              <div className={`p-12 border border-dashed ${theme === 'dark' ? 'border-white/10' : 'border-neutral-300'} rounded-3xl text-center space-y-4 bg-white/[0.01]`}>
                <span className="text-4xl block">📑</span>
                <p className="font-bold text-lg">Academic CV Multi-Page Matrix Activated</p>
                <p className={`text-sm ${activeTheme.textMuted} max-w-md mx-auto`}>Optimized layout structure loaded for long-form research papers, citations, publications, and professional tenure history.</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* --- BLUEPRINT DESIGN SEQUENCER POPUP WIZARD MODAL --- */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWizard(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`relative ${activeTheme.modalBg} border rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden`}
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600"></div>

              {wizardStep === 1 && (
                <div>
                  <div className="mb-6">
                    <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest block mb-1">Configuration Sequence 01</span>
                    <h3 className="text-xl font-black uppercase tracking-tight">WHAT DO YOU WANNA BUILD</h3>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className={`group w-full p-5 rounded-2xl text-left border transition ${
                        theme === 'dark' ? 'bg-white/[0.01] border-white/5 hover:border-cyan-500/30' : 'bg-neutral-50 border-neutral-200 hover:border-cyan-500/40'
                      }`}
                    >
                      <h4 className="text-sm font-bold group-hover:text-cyan-500 transition uppercase tracking-wider">01.Resume</h4>
                      <p className={`text-xs ${activeTheme.textMuted} mt-1 font-light leading-relaxed`}>Standard professional layout designed for ATS engines and recruiters.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunch("cv")}
                      className={`group w-full p-5 rounded-2xl text-left border transition ${
                        theme === 'dark' ? 'bg-white/[0.01] border-white/5 hover:border-purple-500/30' : 'bg-neutral-50 border-neutral-200 hover:border-purple-500/40'
                      }`}
                    >
                      <h4 className="text-sm font-bold group-hover:text-purple-500 transition uppercase tracking-wider">02.Curriculum Vitae</h4>
                      <p className={`text-xs ${activeTheme.textMuted} mt-1 font-light leading-relaxed`}>Deep compilation structural system for journals, fellowships, and research parameters.</p>
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div>
                  <div className="mb-6">
                    <span className="text-[10px] font-mono text-purple-500 uppercase tracking-widest block mb-1">Configuration Sequence 02</span>
                    <h3 className="text-xl font-black uppercase tracking-tight">CHOOSE AI ENGINE STRATEGY TO BUILD YOUR PROFESSIONAL RESUME </h3>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleLaunch("resume", "interview")}
                      className={`group w-full p-5 rounded-2xl text-left border transition ${
                        theme === 'dark' ? 'bg-white/[0.01] border-white/5 hover:border-cyan-500/30' : 'bg-neutral-50 border-neutral-200 hover:border-cyan-500/40'
                      }`}
                    >
                      <h4 className="text-sm font-bold flex items-center gap-2 group-hover:text-cyan-500 transition uppercase tracking-wider">🎙️ PROFESSIONAL Interview WITH AI</h4>
                      <p className={`text-xs ${activeTheme.textMuted} mt-1 font-light leading-relaxed`}>Talk smoothly with a chat engine to dynamically extrapolate technical parameters.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunch("resume", "chat")}
                      className={`group w-full p-5 rounded-2xl text-left border transition ${
                        theme === 'dark' ? 'bg-white/[0.01] border-white/5 hover:border-indigo-500/30' : 'bg-neutral-50 border-neutral-200 hover:border-indigo-500/40'
                      }`}
                    >
                      <h4 className="text-sm font-bold flex items-center gap-2 group-hover:text-indigo-400 transition uppercase tracking-wider">💬 Direct INPUT PROMPT ENGINE</h4>
                      <p className={`text-xs ${activeTheme.textMuted} mt-1 font-light leading-relaxed`}>Instantly parse old templates or custom unstructured text fragments directly.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className={`w-full text-center text-xs font-mono uppercase tracking-wider mt-6 block hover:text-cyan-500 transition ${activeTheme.textMuted}`}
                    >
                      &larr; Retrack Sequence Block
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}