import { motion } from "framer-motion";

export default function BuilderEntry({ type, onSelectChoice }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative px-6 overflow-hidden">
      
      {/* Background Matrix Grid to match your Home page layout perfectly */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:6rem_4rem] pointer-events-none z-0 opacity-20"></div>
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"></div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-[0.2em]">
            {type === "cv" ? "CV Workspace Mode" : "Resume Workspace Mode"}
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mt-6 mb-3">
            How would you like to build your {type === "cv" ? "CV" : "Resume"}?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto font-light mb-12">
            Select your generation workspace method. You can still modify, restructure, or edit your raw sections manually at any point later.
          </p>
        </motion.div>

        {/* Dynamic Split Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          
          {/* OPTION 1: THE INTERVIEW PATHWAY */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            whileHover={{ y: -6, borderColor: "rgba(34, 211, 238, 0.4)" }}
            onClick={() => onSelectChoice("interview")}
            className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 cursor-pointer transition-colors duration-300 group hover:bg-white/[0.04]"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition duration-200">
              🎙️
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-cyan-400 transition">
              Guided AI Interview
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light">
              Avoid writer's block completely. Chat with our conversational assistant and answer casual, targeted questions about your achievements. The AI structures and writes everything out for you.
            </p>
            <span className="inline-flex items-center text-xs font-semibold tracking-wider uppercase text-cyan-400 group-hover:underline">
              Start Conversation &rarr;
            </span>
          </motion.div>

          {/* OPTION 2: THE PROMPT BOX PATHWAY */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            whileHover={{ y: -6, borderColor: "rgba(99, 102, 241, 0.4)" }}
            onClick={() => onSelectChoice("prompt")}
            className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 cursor-pointer transition-colors duration-300 group hover:bg-white/[0.04]"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition duration-200">
              ✍️
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-indigo-400 transition">
              Custom Prompt Box
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light">
              Ideal if you already have clear parameters in mind. Drop in your rough bullet points, paste your targets, or provide explicit system rules directly inside a clean, text instruction block.
            </p>
            <span className="inline-flex items-center text-xs font-semibold tracking-wider uppercase text-indigo-400 group-hover:underline">
              Open Prompt Panel &rarr;
            </span>
          </motion.div>

        </div>
      </div>
    </div>
  );
}