import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden relative select-none">
      
      {/* Background Grid Layer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:6rem_4rem] pointer-events-none z-0"
      ></motion.div>

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-16 py-5 border-b border-white/10 backdrop-blur-xl bg-[#0a0a0a]/70 shadow-lg shadow-black/20"
      >
        {/* System Name with dynamic hover glow effects */}
        <motion.h1 
          whileHover={{ 
            scale: 1.02,
            textShadow: "0px 0px 12px rgba(34, 211, 238, 0.6)",
            filter: "drop-shadow(0px 0px 8px rgba(34, 211, 238, 0.4))"
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-3xl font-bold tracking-wide text-cyan-400 cursor-pointer transition-colors duration-300 hover:text-cyan-300"
        >
          GridFlow
        </motion.h1>

        <div className="hidden md:flex items-center gap-10 text-gray-300 font-medium">
          <a href="#features" className="hover:text-cyan-400 transition duration-200">Features</a>
          <a href="#features" className="hover:text-cyan-400 transition duration-200">Templates</a>
          <a href="#" className="hover:text-cyan-400 transition duration-200">About</a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500 transition duration-200"
          >
            Login
          </Link>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/signup"
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl font-semibold transition duration-200 shadow-lg shadow-cyan-600/20 block"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* 1. BACKGROUND IMAGE LAYER (Increased viewport height scale) */}
      <div className="absolute top-[89px] left-0 right-0 z-0 flex items-start justify-center pointer-events-none overflow-hidden h-[70vh] md:h-[75vh]">
        {/* Adjusted Ambient Neon Backglow to sit lower down */}
        <div className="absolute top-[15%] w-[1000px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px]"></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 0.4, 
            scale: 1,
            y: [0, -10, 0]
          }}
          transition={{ 
            opacity: { delay: 0.3, duration: 1.2 },
            scale: { delay: 0.3, duration: 1.0, ease: "easeOut" },
            y: { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-full max-w-full h-full px-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop" 
            alt="Abstract Tech Infrastructure Network" 
            className="w-full h-full object-cover"
            style={{ 
              /* Modified stops (60% and 85%) to make the clear layout extend lower down the page */
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 60%, rgba(0,0,0,0.3) 85%, transparent 100%)', 
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 60%, rgba(0,0,0,0.3) 85%, transparent 100%)' 
            }}
          />
        </motion.div>
      </div>

      {/* 2. CENTERED HERO CONTENT LAYER */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 md:pt-40">
        
        {/* Pulsing Badge */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-[0.2em] mb-8"
        >
          ⚡ AI Powered Resume Workspace
        </motion.div>

        {/* Big Centered Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-black leading-tight max-w-5xl tracking-tight"
        >
          Create Your Future with
          <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">
            Smart AI Resumes
          </span>
        </motion.h1>

        {/* Subtitle description */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-8 text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed font-light"
        >
          Build beautiful, ATS-optimized resumes in seconds using advanced AI logic. 
          Fast, structural, and custom-tailored for your dream career tracking target.
        </motion.p>

        {/* Interaction CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row gap-5 w-full sm:w-auto px-6"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/signup"
              className="bg-cyan-600 hover:bg-cyan-500 text-center px-8 py-4 rounded-2xl text-lg font-bold transition duration-200 shadow-xl shadow-cyan-600/30 block w-full sm:w-auto"
            >
              🚀 Start Building Free
            </Link>
          </motion.div>

          <a
            href="#features"
            className="border border-white/10 hover:border-cyan-500 text-center px-8 py-4 rounded-2xl text-lg font-semibold transition duration-200 flex items-center justify-center"
          >
            Explore Features
          </a>
        </motion.div>
      </section>

      {/* Feature Cards Section */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        id="features" 
        className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 px-8 md:px-16 py-28 max-w-7xl mx-auto"
      >
        {/* Card 1 */}
        <motion.div 
          variants={fadeInUp}
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
          className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:border-cyan-500/50 hover:bg-white/[0.04] transition duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition duration-200">
            ✍️
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-400 transition">
            AI Content Studio
          </h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            Generate polished executive summaries, key impact-driven action statements, and clean skill blocks instantly via natural input strings.
          </p>
        </motion.div>

        {/* Card 2 */}
        <motion.div 
          variants={fadeInUp}
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
          className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:border-cyan-500/50 hover:bg-white/[0.04] transition duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition duration-200">
            🎯
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-400 transition">
            ATS Compliance Layout
          </h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            Structure information fields exactly how automated applicant parsing scanners expect them, passing automated filters with ease.
          </p>
        </motion.div>

        {/* Card 3 */}
        <motion.div 
          variants={fadeInUp}
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
          className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:border-cyan-500/50 hover:bg-white/[0.04] transition duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition duration-200">
            📄
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-400 transition">
            Seamless PDF Exports
          </h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            Instantly render print-ready multi-page documents optimized with professional typographical balance and auto-wrapped paragraph grids.
          </p>
        </motion.div>
      </motion.section>
    </div>
  );
}