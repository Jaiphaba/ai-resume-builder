import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

// --- FIREBASE INTEGRATION ---
import { db, auth } from "../firebase/firebase"; 
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"; 

// ==========================================
// 🛠️ REUSABLE INLINE EDITABLE FIELDS
// ==========================================
const EditableInput = ({ value, onChange, className = "", ...props }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-purple-400 focus:bg-neutral-50 focus:outline-none py-0.5 px-1 rounded transition duration-150 ${className}`}
    {...props}
  />
);

const EditableTextarea = ({ value, onChange, className = "", rows = 1, ...props }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full leading-relaxed bg-transparent border-0 hover:bg-neutral-50/50 focus:bg-neutral-50 focus:outline-none p-1 rounded transition duration-150 resize-none overflow-hidden h-auto block ${className}`}
      rows={rows}
      {...props}
    />
  );
};

const SidebarSection = ({ title, children }) => (
  <div className="w-full">
    <h4 className="text-xs font-bold uppercase tracking-wider border-b border-neutral-200 pb-1 mb-2.5 text-neutral-800 print:text-neutral-900">
      {title}
    </h4>
    <div className="space-y-3">{children}</div>
  </div>
);

// ==========================================
// 🎙️ ADVANCED SMART INTERVIEW DICTIONARY
// ==========================================
const INTERVIEW_BANK = {
  "Software Engineering & IT": [
    { key: "targetRole", question: "What is your specific target title or seniority level?", options: ["Senior Full-Stack Engineer", "AI / Machine learning Engineer", "DevOps & Cloud Infrastructure Architect", "Solutions Architect / Engineering Manager"] },
    { key: "skills", question: "Which core tech stack fits your daily architecture expertise best?", options: ["React, TypeScript, Node.js, Next.js", "Python, PyTorch, LangChain, LLMs", "Java, Spring Boot, Microservices, PostgreSQL", "AWS, Kubernetes, Terraform, CI/CD Pipelines"] },
    { key: "experienceYears", question: "What is your total professional experience level?", options: ["Junior / Entry Level (0-2 Years)", "Mid-Market Practitioner (3-5 Years)", "Senior / Technical Lead (6-10 Years)", "Principal Architect / Director (10+ Years)"] },
    { key: "metrics", question: "What is your most impactful engineering performance metric?", options: ["Optimized system latency / compute overhead by 30%+", "Built & shipped a zero-to-one production SaaS product", "Scaled application infrastructure to handle millions of requests", "Migrated legacy monoliths to clean cloud-native architecture"] },
    { key: "academia", question: "What is your educational technical foundation?", options: ["Master of Computer Applications (MCA)", "B.Tech / B.E. in Computer Science", "BCA / Information Technology Degree", "Self-Taught / Specialized Bootcamp Graduate"] }
  ],
  "Education & Teaching": [
    { key: "targetRole", question: "What is your target educational leadership framework?", options: ["Primary / Secondary School Teacher", "University Lecturer / Assistant Professor", "Curriculum Director / Instructional Designer", "Special Educational Needs (SEN) Educator"] },
    { key: "skills", question: "What is your primary academic domain or pedagogical approach?", options: ["STEM Subjects (Math, Science, Coding)", "Languages, English, & Liberal Arts", "Montessori & Early Childhood Methodologies", "Hybrid E-Learning & Digital Classroom Tools"] },
    { key: "experienceYears", question: "How long have you been managing academic environments?", options: ["Early Career Educator (0-2 Years)", "Established Classroom Teacher (3-6 Years)", "Senior Faculty / Department Head (7-12 Years)", "Academic Institution Administrator (12+ Years)"] },
    { key: "metrics", question: "What key academic milestone or student impact stands out?", options: ["Boosted classroom performance & test scores by 20%+", "Authored and launched an accredited school-wide curriculum", "Spearheaded digital transformation for online learning systems", "Organized national-level academic exhibitions & symposia"] },
    { key: "academia", question: "What are your professional teaching credentials?", options: ["Bachelor of Education (B.Ed) / M.Ed", "Master of Arts / Science (MA / MSc)", "Ph.D. / Post-Doctoral Researcher", "State Teacher Eligibility Test (STET/CTET) Certified"] }
  ],
  "Business & Corporate Management": [
    { key: "targetRole", question: "What corporate management vector are you stepping into?", options: ["Product / Program Manager", "Director of Operations / Strategy Lead", "Financial Controller / Investment Analyst", "Head of Growth / Marketing Director"] },
    { key: "skills", question: "Where does your day-to-day strategic strength lie?", options: ["Agile Methodologies, Product Strategy & Scoping", "Financial Modeling, Budgeting & Risk Management", "Growth Hacking, SEO, & Performance Marketing", "Talent Acquisition, Performance Management & HR Operations"] },
    { key: "experienceYears", question: "What is your management background duration?", options: ["Individual Corporate Contributor (0-2 Years)", "Mid-Level Manager / Team Leader (3-6 Years)", "Senior Manager / Director (7-12 Years)", "Executive Leadership / VP / C-Suite (12+ Years)"] },
    { key: "metrics", question: "What is the primary business metric you generated?", options: ["Drove revenue growth / client retention up by 25%+", "Optimized operational costs, saving $50k+ annually", "Led cross-functional teams of 15+ to ship priority products", "Negotiated and closed high-value enterprise partnerships"] },
    { key: "academia", question: "What is your business educational pedigree?", options: ["Master of Business Administration (MBA)", "Bachelor of Commerce (B.Com) / M.Com", "BBA / Bachelor of Management Studies", "Chartered Accountant (CA) / CFA / PMP Certified"] }
  ],
  "Healthcare & Medicine": [
    { key: "targetRole", question: "What is your target medical practice setting?", options: ["Registered Nurse (ICU / Critical Care)", "Resident Physician / Medical Consultant", "Healthcare Administrator / Clinical Supervisor", "Medical Laboratory Technologist"] },
    { key: "skills", question: "What is your core clinical specialty focus?", options: ["Acute Patient Care & Resuscitation Protocols", "Diagnostic Assessments & Treatment Formulation", "Electronic Health Records (EHR) & Clinical Workflows", "Patient Advocacy, Triage, & Ward Management"] },
    { key: "experienceYears", question: "How long have you practiced inside clinical environments?", options: ["Junior Practitioner / Intern (0-2 Years)", "Staff Nurse / Clinical Practitioner (3-6 Years)", "Senior Ward Manager / Specialist Consultant (7-12 Years)", "Chief Medical Officer / Nursing Director (12+ Years)"] },
    { key: "metrics", question: "Which patient care metric defines your professional tenure?", options: ["Maintained 99% accuracy in emergency medicine execution", "Reduced patient discharge processing times by 40%", "Supervised and trained a staff of 20+ clinical personnel", "Implemented updated hospital infection control standards"] },
    { key: "academia", question: "What are your authorized clinical credentials?", options: ["Bachelor of Science in Nursing (B.Sc. Nursing) / GNM", "Master of Science in Nursing (MSN)", "Bachelor of Medicine, Bachelor of Surgery (MBBS)", "MD / Specialized Medical Board Certified"] }
  ]
};

// ==========================================
// 🚀 MAIN CV BUILDER WORKSPACE
// ==========================================
export default function CvBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [existingDocId, setExistingDocId] = useState(location.state?.id || null);
  
  const [buildMode, setBuildMode] = useState(null);

  // --- DESIGN LAYOUT CONFIGS ---
  const [layoutConfig, setLayoutConfig] = useState({
    theme: location.state?.existingResume?.layout?.theme || "classic",      
    fontStyle: location.state?.existingResume?.layout?.fontStyle || "sans",   
    spacing: location.state?.existingResume?.layout?.spacing || "normal",     
    accentColor: location.state?.existingResume?.layout?.accentColor || "#6B21A8" 
  });

  // --- CANVAS CENTRALIZED APP SCHEMAS ---
  const [cvData, setCvData] = useState({
    fullName: location.state?.existingResume?.personalInfo?.fullName || location.state?.existingResume?.fullName || "YOUR FULL NAME",
    title: location.state?.existingResume?.title || "Professional Career Profile",
    email: location.state?.existingResume?.personalInfo?.email || location.state?.existingResume?.email || "your.email@example.com",
    phone: location.state?.existingResume?.personalInfo?.phone || location.state?.existingResume?.phone || "0000000000",
    location: location.state?.existingResume?.personalInfo?.location || location.state?.existingResume?.location || "Your City, State",
    imageSrc: location.state?.existingResume?.imageSrc || "", 
    summary: location.state?.existingResume?.summary || "Your professionally curated profile statement will display here once the wizard finishes or when manually drafted...",
    
    skillsList: location.state?.existingResume?.skillsList || ["Strategic Leadership", "Process Optimization", "Cross-functional Coordination"],
    
    education: location.state?.existingResume?.education || [
      { degree: "Degree / Course Name", institution: "University / Institute", year: "Graduation Year" }
    ],
    experience: location.state?.existingResume?.experience || [
      { role: "Current Target Senior Role", company: "Premium Global Enterprise Inc.", period: "2024 - Present", details: "Spearheaded organizational scaling initiatives, aligning modern technology stacks and domain frameworks with corporate performance goals. Managed key project workflows and cross-functional teams to expand operational output by explicit margins." }
    ],
    publications: location.state?.existingResume?.publications || [
      { title: "Key Professional Achievement / Project Description", journal: "Organization / Scope", year: "2026" }
    ]
  });

  // --- WIZARD TRACKING STATES ---
  const [selectedJobCategory, setSelectedJobCategory] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); 
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customOtherText, setCustomOtherText] = useState("");
  const [interviewAnswers, setInterviewAnswers] = useState({
    profession: "",
    targetRole: "",
    skills: "",
    experienceYears: "",
    metrics: "",
    academia: ""
  });

  const dynamicSteps = [
    { key: "profession", question: "What professional industry track are you targeting for this CV?", options: Object.keys(INTERVIEW_BANK) },
    ...(selectedJobCategory ? INTERVIEW_BANK[selectedJobCategory] : [])
  ];

  // --- OPTION SELECT CONTROLLER ---
  const handleOptionSelect = async (selectedAnswer) => {
    const currentQuestionKey = dynamicSteps[currentStep].key;
    const updatedAnswers = { ...interviewAnswers, [currentQuestionKey]: selectedAnswer };
    setInterviewAnswers(updatedAnswers);

    if (currentStep === 0) {
      setSelectedJobCategory(selectedAnswer);
      setCurrentStep(1);
      setShowOtherInput(false);
      setCustomOtherText("");
    } else if (currentStep < dynamicSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowOtherInput(false);
      setCustomOtherText("");
    } else {
      await compileChatToCv(updatedAnswers);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customOtherText.trim()) return;
    await handleOptionSelect(customOtherText.trim());
  };

  // --- RECRUITER AI COMPILER SYSTEM ---
  const compileChatToCv = async (compiledAnswers) => {
    setIsGenerating(true);
    setBuildMode("prompt");
    
    handleInputChange("title", compiledAnswers.targetRole || compiledAnswers.profession);
    handleInputChange("summary", "⏳ Orchestrating executive profile summary data using corporate analytics frameworks...");

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", 
          messages: [
            {
              role: "system",
              content: "You are an elite executive resume writer. Write a highly persuasive, 3-sentence executive profile summary for a resume using the provided job details. Incorporate their years of experience, core tech or domain skills, and their primary numerical metric or accomplishment naturally. Use an active, high-impact tone without cliché introductions. Output ONLY the plain text summary paragraph."
            },
            {
              role: "user",
              content: `Target Role: ${compiledAnswers.targetRole}, Tech/Domain Skills: ${compiledAnswers.skills}, Experience Level: ${compiledAnswers.experienceYears}, Peak Strategic Impact: ${compiledAnswers.metrics}, Academic Credentials: ${compiledAnswers.academia}`
            }
          ],
          temperature: 0.6
        })
      });

      const data = await response.json();
      const summaryText = data.choices[0].message.content;
      
      handleInputChange("summary", summaryText.trim());
      
      const splitSkills = compiledAnswers.skills.split(",").map(s => s.trim());

      setCvData(prev => ({
        ...prev,
        skillsList: [...splitSkills, "Strategic Execution", "Performance Metrics Tracking"],
        education: [{ degree: compiledAnswers.academia, institution: "Verified University/Institution", year: "2022" }],
        
        experience: [
          {
            role: `Senior ${compiledAnswers.targetRole}`,
            company: "Market Leading Innovations Ltd.",
            period: "2024 - Present",
            details: `Driving core architecture scaling and management operations. Systematically executed tasks utilizing ${compiledAnswers.skills} to deliver business value, resulting in a milestone realization where operations successfully achieved: ${compiledAnswers.metrics}.`
          },
          {
            role: compiledAnswers.targetRole,
            company: "Global Solutions Infrastructure Corp.",
            period: "2021 - 2024",
            details: `Managed daily deployment pipelines and specialized strategy architectures. Anchored full life-cycle operations by leveraging core domain capabilities in ${splitSkills[0] || "assigned verticals"}. Mentored junior cross-functional team practitioners to build high-availability ecosystems.`
          },
          {
            role: `Associate Project Lead / Practitioner`,
            company: "Pioneer Technology & Strategy Ventures",
            period: "2019 - 2021",
            details: `Contributed foundational engineering/operational executions across cross-functional parameters. Delivered projects ahead of schedule while maintaining 100% compliance alignment flags. Built optimized processes that cut resource waste margins.`
          }
        ],
        
        publications: [
          { title: compiledAnswers.metrics, journal: `${compiledAnswers.targetRole} Core Milestone`, year: "2025" },
          { title: `Advanced Infrastructure Engineering of ${splitSkills[0] || "Target Stack"} Structures`, journal: "Operational Execution Scope", year: "2026" }
        ]
      }));

    } catch (err) {
      console.error("Groq Engine Error:", err);
      alert("Failed to build text summaries via Groq API.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- MANUAL CONSOLE AI REWRITE HANDLER ---
  const handleAiGeneration = async () => {
    if (!aiPrompt.trim()) return alert("Please specify your formatting command keywords.");
    
    setIsGenerating(true);
    handleInputChange("summary", "⚡ Groq is refining your professional text layout summary blocks...");

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", 
          messages: [
            {
              role: "system",
              content: "You are an expert resume assistant. Rewrite the input text parameters into an immaculate, 3-4 sentence summary tailored for professional standards. Do not include commentary introduction sentences."
            },
            {
              role: "user",
              content: aiPrompt
            }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      const realGroqText = data.choices[0].message.content;
      
      handleInputChange("summary", realGroqText.trim());
      setAiPrompt(""); 

    } catch (error) {
      console.error("Groq Error:", error);
      alert("Failed to compile layout updates from Groq.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- CORE SYSTEM CHANGE TRIGGERS ---
  const handleInputChange = (field, value) => {
    setCvData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (arrayKey, index, objectKey, value) => {
    setCvData((prev) => {
      const updatedArray = [...prev[arrayKey]];
      updatedArray[index] = { ...updatedArray[index], [objectKey]: value };
      return { ...prev, [arrayKey]: updatedArray };
    });
  };

  const addArrayItem = (arrayKey, schema) => {
    setCvData(prev => ({ ...prev, [arrayKey]: [...prev[arrayKey], schema] }));
  };

  const removeArrayItem = (arrayKey, index) => {
    setCvData(prev => ({ ...prev, [arrayKey]: prev[arrayKey].filter((_, i) => i !== index) }));
  };

  const handleSkillElementChange = (idx, value) => {
    setCvData(prev => {
      const copy = [...prev.skillsList];
      copy[idx] = value;
      return { ...prev, skillsList: copy };
    });
  };

  // --- FILE EXPORT CONTROLLERS ---
  const handleSaveAndDownload = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return alert("Session expired. Please log in again.");

    setIsSaving(true);
    try {
      const cvPayload = {
        userId: currentUser.uid,            
        type: "cv",                                         
        title: cvData.title || "",
        summary: cvData.summary || "",
        imageSrc: cvData.imageSrc || "",
        education: cvData.education || [],
        publications: cvData.publications || [],
        experience: cvData.experience || [],
        skillsList: cvData.skillsList || [],
        personalInfo: {                      
          fullName: cvData.fullName || "",
          email: cvData.email || "",
          phone: cvData.phone || "",
          location: cvData.location || ""
        },
        layout: layoutConfig,
        updatedAt: serverTimestamp()        
      };

      if (existingDocId) {
        await setDoc(doc(db, "cvs", existingDocId), cvPayload);
      } else {
        cvPayload.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, "cvs"), cvPayload);
        setExistingDocId(docRef.id);
      }
      
      setIsSaving(false);
      alert("🎉 Data Securely Synchronized! Generating physical printing systems layout...");
      window.print();
    } catch (error) {
      console.error("Cloud Error: ", error);
      alert(`Sync Failure: ${error.message}`);
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCvData((prev) => ({ ...prev, imageSrc: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const getFontClass = () => {
    if (layoutConfig.fontStyle === "serif") return "font-serif tracking-normal text-neutral-900";
    if (layoutConfig.fontStyle === "mono") return "font-mono tracking-tight text-neutral-800";
    return "font-sans tracking-wide text-neutral-900";
  };

  const getSpacingClass = () => {
    if (layoutConfig.spacing === "tight") return "space-y-4 p-6 text-[11px] leading-tight";
    if (layoutConfig.spacing === "spacious") return "space-y-8 p-12 text-sm leading-relaxed";
    return "space-y-5 p-9 text-xs leading-normal"; 
  };

  const getSidebarTheme = () => {
    if (layoutConfig.theme === "minimalist") {
      return "bg-white border-r border-neutral-200 text-neutral-800 print:border-r print:border-neutral-200";
    }
    if (layoutConfig.theme === "executive") {
      return "bg-[#1e293b] text-slate-100 print:bg-[#1e293b] print:text-slate-100"; 
    }
    return "bg-[#f4f5f7] text-neutral-700 print:bg-[#f4f5f7] print:text-neutral-700"; 
  };

  // ================= HOME INTRO MENU SCREEN =================
  if (buildMode === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:6rem_4rem] pointer-events-none z-0 opacity-20"></div>
        <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"></div>

        <div className="relative z-10 max-w-4xl w-full text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-[0.2em]">
              Smart Dynamic CV Platform Node
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mt-6 mb-3">
              CHOOSE AI ENGINE STRATEGY TO BUILD YOUR PROFESSIONAL CV
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto font-light mb-12 text-sm">
              Launch the tailored metrics choice-engine or write directly onto a blank custom canvas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <motion.div
              whileHover={{ y: -6, borderColor: "rgba(168, 85, 247, 0.4)" }}
              onClick={() => { setCurrentStep(0); setSelectedJobCategory(null); setBuildMode("interview"); }}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 cursor-pointer transition-all duration-300 group hover:bg-white/[0.04]"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition duration-200">🎙️</div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-400 transition">PROFESSIONAL INTERVIEW WITH AI</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-6 font-light">
                Select your industry track. The system adapts deep, metric-focused quiz questions recursively for automated elite Groq AI generation.
              </p>
              <span className="text-xs font-semibold uppercase text-purple-400 group-hover:underline">Launch Career Card Flow &rarr;</span>
            </motion.div>

            <motion.div
              whileHover={{ y: -6, borderColor: "rgba(139, 92, 246, 0.4)" }}
              onClick={() => setBuildMode("prompt")}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 cursor-pointer transition-all duration-300 group hover:bg-white/[0.04]"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition duration-200">🎨</div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-indigo-400 transition">Direct INPUT PROMPT ENGINE</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-6 font-light">
                Skip the custom card setups and go straight to the layout document sheet to write and format your parameters manually.
              </p>
              <span className="text-xs font-semibold uppercase text-indigo-400 group-hover:underline">Open Blank Canvas &rarr;</span>
            </motion.div>
          </div>
          
          <button onClick={() => navigate("/dashboard")} className="mt-12 text-xs text-neutral-500 hover:text-white transition tracking-widest uppercase font-bold">&larr; Return to Dashboard</button>
        </div>
      </div>
    );
  }

  // ================= MAIN COMPILER WORKSPACE SHEET =================
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      
      {/* HEADER BAR CONTROLS */}
      <div className="h-16 border-b border-white/10 bg-[#0f0f0f] px-6 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => setBuildMode(null)} className="text-xs font-bold text-neutral-400 hover:text-white bg-white/5 px-3 py-2 rounded-lg transition">
            ← Back to Menu
          </button>
          <div className="h-4 w-px bg-white/10" />
          <h2 className="text-sm font-black tracking-wider text-purple-400 uppercase">CV Engine Pro</h2>
        </div>

        <button 
          onClick={handleSaveAndDownload}
          disabled={isSaving || isGenerating}
          className="bg-purple-600 hover:bg-purple-500 text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          <span>💾</span>
          {isSaving ? "Saving Workspace Data..." : "Save & Export PDF"}
        </button>
      </div>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex overflow-hidden print:block print:overflow-visible">
        
        {/* LEFT TOOLBAR PANEL */}
        <div className="w-[420px] border-r border-white/10 bg-[#0f0f0f]/50 p-5 overflow-y-auto space-y-5 shrink-0 print:hidden">
          
          {/* 📍 NEW EXTRA CONTROL FORM: DIRECT PERSONAL INFO BINDINGS */}
          <div className="bg-[#111] border border-white/5 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-purple-400 uppercase font-mono tracking-wider border-b border-white/10 pb-1.5 flex items-center gap-2">
              <span>👤</span> Contact Details Form
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-neutral-400 font-mono block mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={cvData.fullName} 
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="w-full bg-black border border-white/10 p-2 text-[11px] rounded-lg text-white outline-none focus:border-purple-500" 
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 font-mono block mb-1">Target Job Title</label>
                <input 
                  type="text" 
                  value={cvData.title} 
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full bg-black border border-white/10 p-2 text-[11px] rounded-lg text-white outline-none focus:border-purple-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 font-mono block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={cvData.email} 
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-[11px] rounded-lg text-white outline-none focus:border-purple-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-mono block mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={cvData.phone} 
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-[11px] rounded-lg text-white outline-none focus:border-purple-500" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 font-mono block mb-1">Address / Location</label>
                <input 
                  type="text" 
                  value={cvData.location} 
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full bg-black border border-white/10 p-2 text-[11px] rounded-lg text-white outline-none focus:border-purple-500" 
                />
              </div>
            </div>
          </div>

          {buildMode === "interview" ? (
            <div className="bg-[#111] border border-purple-500/30 p-5 rounded-2xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase">
                  Step {currentStep + 1} of {dynamicSteps.length}
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 text-[9px] font-mono">
                  {selectedJobCategory ? "Tailored Track" : "Global Selector"}
                </span>
              </div>

              <h3 className="text-sm font-bold text-neutral-100 leading-snug">
                {dynamicSteps[currentStep]?.question}
              </h3>

              <div className="space-y-2 pt-2">
                {dynamicSteps[currentStep]?.options?.map((option, optionIdx) => (
                  <button
                    key={optionIdx}
                    onClick={() => handleOptionSelect(option)}
                    className="w-full text-left bg-neutral-900 border border-white/5 hover:border-purple-500/40 hover:bg-purple-950/20 text-xs p-3 rounded-xl transition duration-150 text-neutral-300 font-light"
                  >
                    {option}
                  </button>
                ))}

                <button
                  onClick={() => setShowOtherInput(!showOtherInput)}
                  className={`w-full text-left border text-xs p-3 rounded-xl transition duration-150 font-medium ${showOtherInput ? "border-purple-500 bg-purple-950/30 text-purple-300" : "bg-neutral-900 border-white/5 text-purple-400 hover:bg-neutral-800"}`}
                >
                  ✨ Custom Option (Type your answer manually...)
                </button>
              </div>

              {showOtherInput && (
                <form onSubmit={handleCustomSubmit} className="pt-2 flex gap-2">
                  <input
                    type="text"
                    value={customOtherText}
                    onChange={(e) => setCustomOtherText(e.target.value)}
                    placeholder="Type your specific milestone metrics here..."
                    autoFocus
                    className="flex-1 bg-black text-xs border border-purple-500/40 rounded-xl px-3 py-2.5 text-white outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!customOtherText.trim()}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-bold px-4 rounded-xl uppercase tracking-wider text-white transition"
                  >
                    Next
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-[#111] border border-purple-500/20 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-purple-400 uppercase font-mono tracking-wider border-b border-white/10 pb-1.5 flex items-center gap-2">
                <span>⚡</span> Groq AI Summary Writer
              </h3>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Tell the AI what you want to highlight, like cloud infrastructure or teaching methodologies..."
                className="w-full h-20 bg-black/40 border border-white/10 p-2 text-[11px] rounded-lg text-neutral-200 outline-none focus:border-purple-500/40 resize-none placeholder-neutral-600"
              />
              <button
                onClick={handleAiGeneration}
                disabled={isGenerating}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-[11px] font-bold py-2 rounded-lg transition"
              >
                {isGenerating ? "Talking to Groq Systems..." : "Rewrite Profile Summary"}
              </button>
            </div>
          )}

          {/* LAYOUT PARAMETERS STYLE SELECTION CARD */}
          <div className="bg-[#111] border border-white/5 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-purple-400 uppercase font-mono tracking-wider border-b border-white/10 pb-1.5">🎨 Design Sheet Layout</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 uppercase font-mono">Theme View</label>
              <div className="grid grid-cols-3 gap-2">
                {["classic", "minimalist", "executive"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setLayoutConfig({ ...layoutConfig, theme: t })}
                    className={`text-[11px] py-1.5 px-1 rounded-lg border font-medium capitalize transition ${layoutConfig.theme === t ? "border-purple-500 bg-purple-900/20 text-white" : "border-white/10 bg-black/30 text-neutral-400"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 uppercase font-mono">Typography Font</label>
              <div className="grid grid-cols-3 gap-2">
                {["sans", "serif", "mono"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setLayoutConfig({ ...layoutConfig, fontStyle: f })}
                    className={`text-[11px] py-1.5 px-1 rounded-lg border font-medium capitalize transition ${layoutConfig.fontStyle === f ? "border-purple-500 bg-purple-900/20 text-white" : "border-white/10 bg-black/30 text-neutral-400"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 uppercase font-mono">Text Padding Spacing</label>
              <div className="grid grid-cols-3 gap-2">
                {["tight", "normal", "spacious"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setLayoutConfig({ ...layoutConfig, spacing: s })}
                    className={`text-[11px] py-1.5 px-1 rounded-lg border font-medium capitalize transition ${layoutConfig.spacing === s ? "border-purple-500 bg-purple-900/20 text-white" : "border-white/10 bg-black/30 text-neutral-400"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 uppercase font-mono">Accent Theme Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={layoutConfig.accentColor}
                  onChange={(e) => setLayoutConfig({ ...layoutConfig, accentColor: e.target.value })}
                  className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer outline-none"
                />
                <span className="text-xs font-mono text-neutral-400 uppercase">{layoutConfig.accentColor}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              {cvData.imageSrc ? <img src={cvData.imageSrc} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-[9px] text-neutral-600">Empty</span>}
            </div>
            <label className="flex-1 text-center bg-white/5 border border-white/10 text-xs font-semibold py-2 rounded-lg cursor-pointer hover:bg-white/10 transition">
              Upload Profile Photo
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* RIGHT LIVE COMPILER RESUME DOCUMENT SHEET CANVAS */}
        <div className="flex-1 bg-[#141414] p-8 overflow-y-auto flex justify-center items-start print:p-0 print:bg-white print:overflow-visible print:block">
          <div className={`w-[794px] min-h-[1123px] bg-white text-black shadow-2xl rounded-sm grid grid-cols-[240px_1fr] print:grid-cols-[240px_1fr] tracking-normal shrink-0 print:shadow-none print:w-full print:min-h-auto print:overflow-visible ${getFontClass()}`}>
            
            {/* CANVAS SIDEBAR COLUMN SECTION */}
            <div className={`p-8 flex flex-col items-center gap-6 transition-all duration-300 print:min-h-[1123px] ${getSidebarTheme()}`}>
              <div className="w-32 h-32 rounded-full border-4 border-white bg-neutral-200 overflow-hidden shadow-md mb-4 flex items-center justify-center shrink-0">
                {cvData.imageSrc ? (
                  <img src={cvData.imageSrc} alt={cvData.fullName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z"/>
                  </svg>
                )}
              </div>

              <SidebarSection title="Contact Details">
                <div className="space-y-1.5 opacity-90 text-[11px]">
                  <EditableInput value={cvData.email} onChange={(val) => handleInputChange("email", val)} placeholder="Email Address" />
                  <EditableInput value={cvData.phone} onChange={(val) => handleInputChange("phone", val)} placeholder="Phone Number" />
                  <EditableInput value={cvData.location} onChange={(val) => handleInputChange("location", val)} placeholder="Location" />
                </div>
              </SidebarSection>

              {/* DYNAMIC SKILLS MATRIX ACCELERATOR SECTION */}
              <SidebarSection title="Core Competencies">
                <div className="flex flex-col gap-1.5">
                  {cvData.skillsList.map((skill, index) => (
                    <div key={index} className="group relative w-full">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => handleSkillElementChange(index, e.target.value)}
                        placeholder="Expertise Skill Capability"
                        className="w-full text-[11px] bg-neutral-50/10 hover:bg-neutral-50/50 focus:bg-white/90 border border-neutral-300/40 rounded px-2 py-1 text-neutral-800 transition focus:outline-none font-medium"
                      />
                      <button
                        onClick={() => setCvData(prev => ({ ...prev, skillsList: prev.skillsList.filter((_, i) => i !== index) }))}
                        className="absolute right-1.5 top-1.5 text-[9px] text-red-500 opacity-0 group-hover:opacity-100 transition print:hidden"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setCvData(prev => ({ ...prev, skillsList: [...prev.skillsList, ""] }))}
                    className="text-[10px] text-purple-600 font-bold mt-1 block hover:underline text-left print:hidden"
                  >
                    + Add Skill Tag
                  </button>
                </div>
              </SidebarSection>

              <SidebarSection title="Education History">
                {cvData.education.map((edu, idx) => (
                  <div key={idx} className="group relative space-y-0.5 text-[11px] border-l border-neutral-300/60 pl-2">
                    <EditableInput value={edu.degree} onChange={(v) => handleArrayChange("education", idx, "degree", v)} className="font-semibold" placeholder="Degree / Certificate" />
                    <EditableInput value={edu.institution} onChange={(v) => handleArrayChange("education", idx, "institution", v)} className="italic text-neutral-600" placeholder="School / University" />
                    <EditableInput value={edu.year} onChange={(v) => handleArrayChange("education", idx, "year", v)} className="opacity-70 font-mono text-[10px]" placeholder="Timeline Year" />
                    <button 
                      onClick={() => removeArrayItem("education", idx)} 
                      className="absolute -right-1 top-0 text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition print:hidden"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => addArrayItem("education", { degree: "", institution: "", year: "" })} 
                  className="w-full text-left text-[10px] text-purple-600 font-bold border-t border-dashed pt-1 mt-1 print:hidden"
                >
                  + Add Education Block
                </button>
              </SidebarSection>
            </div>

            {/* MAIN WHITE COLUMN AREA */}
            <div className={`transition-all duration-300 flex flex-col justify-between ${getSpacingClass()}`}>
              <div className="space-y-5">
                
                {/* Header Identity Display */}
                <div className="pb-3 border-b border-neutral-200 space-y-0.5">
                  <EditableInput value={cvData.fullName} onChange={(val) => handleInputChange("fullName", val)} className="text-3xl font-light tracking-wide text-neutral-900 uppercase" />
                  <EditableInput 
                    value={cvData.title} 
                    onChange={(val) => handleInputChange("title", val)} 
                    className="text-sm font-semibold tracking-wider uppercase" 
                    style={{ color: layoutConfig.accentColor }} 
                  />
                </div>

                {/* Profile Summary Section */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-800 border-b border-neutral-200 pb-1 mb-2">
                    Professional Summary
                  </h3>
                  <EditableTextarea value={cvData.summary} onChange={(val) => handleInputChange("summary", val)} className="text-neutral-600 font-light" />
                </div>

                {/* Experience Block */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-800 border-b border-neutral-200 pb-1 mb-3">
                    Professional Work Experience
                  </h3>
                  <div className="space-y-4">
                    {cvData.experience?.map((exp, idx) => (
                      <div key={idx} className="group relative space-y-1">
                        <div className="flex justify-between items-baseline">
                          <div className="flex items-baseline gap-2">
                            <input 
                              type="text" 
                              value={exp.role} 
                              onChange={(e) => handleArrayChange("experience", idx, "role", e.target.value)}
                              className="font-bold text-neutral-900 bg-transparent text-[13px] outline-none border-b border-transparent hover:border-neutral-200 focus:border-purple-500 rounded px-0.5 min-w-[200px]"
                              placeholder="Position Title"
                            />
                            <span className="text-neutral-400 text-[10px]">|</span>
                            <input 
                              type="text" 
                              value={exp.company} 
                              onChange={(e) => handleArrayChange("experience", idx, "company", e.target.value)}
                              className="italic text-neutral-650 bg-transparent text-xs outline-none border-b border-transparent hover:border-neutral-200 focus:border-purple-500 rounded px-0.5"
                              placeholder="Enterprise Corporation"
                            />
                          </div>
                          <input 
                            type="text" 
                            value={exp.period} 
                            onChange={(e) => handleArrayChange("experience", idx, "period", e.target.value)}
                            className="text-neutral-500 font-mono text-[10px] text-right bg-transparent outline-none border-b border-transparent hover:border-neutral-200 focus:border-purple-500 rounded px-0.5 w-24"
                            placeholder="Timeline Tenure"
                          />
                        </div>
                        <EditableTextarea 
                          value={exp.details} 
                          onChange={(val) => handleArrayChange("experience", idx, "details", val)}
                          className="text-neutral-600 font-light pl-0.5"
                          placeholder="Detail corporate responsibilities..."
                        />
                        <button 
                          onClick={() => removeArrayItem("experience", idx)} 
                          className="absolute -right-2 top-0 text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition p-1 print:hidden"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => addArrayItem("experience", { role: "", company: "", period: "", details: "" })} 
                      className="text-[10px] text-purple-600 font-bold block pt-0.5 hover:underline print:hidden"
                    >
                      + Add Professional Work Record
                    </button>
                  </div>
                </div>

                {/* Key Highlights Section */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-800 border-b border-neutral-200 pb-1 mb-3">
                    Key Highlights & Contributions
                  </h3>
                  <div className="space-y-3">
                    {cvData.publications.map((pub, idx) => (
                      <div key={idx} className="group relative flex items-start gap-3 w-full border-b border-neutral-50/50 pb-2 last:border-none">
                        <span 
                          className="font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 text-white print:bg-neutral-800" 
                          style={{ backgroundColor: layoutConfig.accentColor }}
                        >
                          {idx + 1}
                        </span>
                        
                        <div className="flex-1 space-y-1">
                          <EditableTextarea 
                            value={pub.title}
                            onChange={(v) => handleArrayChange("publications", idx, "title", v)}
                            className="font-semibold text-neutral-900 text-xs w-full p-0"
                            placeholder="Describe your prominent milestone..."
                          />
                          
                          <div className="flex items-center gap-1.5 opacity-80 text-[10px] text-neutral-500">
                            <span className="font-medium uppercase tracking-wider">At:</span>
                            <input 
                              type="text"
                              value={pub.journal}
                              onChange={(e) => handleArrayChange("publications", idx, "journal", e.target.value)}
                              className="italic text-neutral-650 bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-purple-400 focus:bg-neutral-50 focus:outline-none rounded transition px-1"
                              placeholder="Company / Scope Institution"
                            />
                            <span className="text-neutral-400 font-light">•</span>
                            <input 
                              type="text"
                              value={pub.year}
                              onChange={(e) => handleArrayChange("publications", idx, "year", e.target.value)}
                              className="bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-purple-400 focus:bg-neutral-50 focus:outline-none rounded transition px-1 w-16 text-left font-mono"
                              placeholder="Timeline Year"
                            />
                          </div>
                        </div>

                        <button 
                          onClick={() => removeArrayItem("publications", idx)} 
                          className="absolute -right-2 top-0 text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition p-1 hover:scale-110 print:hidden"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => addArrayItem("publications", { title: "", journal: "", year: "" })} 
                      className="text-[10px] text-purple-600 font-bold block pt-0.5 hover:underline print:hidden"
                    >
                      + Add Highlight Record Item
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}