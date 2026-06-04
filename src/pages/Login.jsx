import { Link, useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase/firebase"
import { useState } from "react"

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault() // Prevents page reload on form submit
    
    if (!email || !password) {
      alert("Please fill in all fields.")
      return
    }

    setLoading(true)

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      alert("Login Successful")

      // FIXED: Swapped out the JSX curly comment format for a clean JavaScript line comment
      navigate("/dashboard")

    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 relative select-none">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-20 pointer-events-none z-0"></div>

      <div className="relative z-10 backdrop-blur-lg bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-10 w-full max-w-md">

        <h1 className="text-white text-5xl font-bold text-center mb-2 tracking-tight">
          Welcome Back
        </h1>

        <p className="text-gray-400 text-center mb-8 text-sm font-light">
          Login to your AI Resume account
        </p>

        <form onSubmit={handleLogin} className="flex flex-col">
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl mb-4 bg-[#111111] border border-white/10 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition duration-150 text-sm"
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl mb-6 bg-[#111111] border border-white/10 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition duration-150 text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-cyan-600/10"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <p className="text-gray-500 text-center mt-6 text-sm font-light">
          Don’t have an account?
          <Link
            to="/signup"
            className="text-cyan-400 ml-2 hover:text-cyan-300 font-normal transition"
          >
            Signup
          </Link>
        </p>

      </div>
    </div>
  )
}