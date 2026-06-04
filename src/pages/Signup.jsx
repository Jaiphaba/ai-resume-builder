import { Link, useNavigate } from "react-router-dom"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase/firebase"
import { useState } from "react"

export default function Signup() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault() // Prevents the browser from reloading the page

    // Client-Side Structural Validation (Checks for name@domain.com structure)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email || !password) {
      alert("Please fill in email and password fields.")
      return
    }

    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address format (e.g., alex@example.com).")
      return
    }

    if (password.length < 6) {
      alert("Password should be at least 6 characters long.")
      return
    }

    setLoading(true)

    try {
      // Firebase Server Authentication Request
      await createUserWithEmailAndPassword(auth, email, password)

      alert("Account Created Successfully!")
      
      // FIXED: Redirects directly to the dashboard instead of the login screen
      navigate("/dashboard")

    } catch (error) {
      // Catch specific network/database errors from Firebase
      switch (error.code) {
        case "auth/invalid-email":
          alert("The email address format is invalid.")
          break;
        case "auth/email-already-in-use":
          alert("This email is already registered to an account. Try logging in instead.")
          break;
        case "auth/weak-password":
          alert("The password is too weak. Please choose a stronger one.")
          break;
        default:
          alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="backdrop-blur-lg bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-10 w-full max-w-md">
        
        <h1 className="text-white text-5xl font-bold text-center mb-2">
          Create Account
        </h1>

        <p className="text-gray-400 text-center mb-8">
          Start building resumes with AI
        </p>

        <form onSubmit={handleSignup} className="flex flex-col">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-xl mb-4 bg-[#111111] border border-white/10 text-white placeholder-gray-500 outline-none focus:border-cyan-500"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl mb-4 bg-[#111111] border border-white/10 text-white placeholder-gray-500 outline-none focus:border-cyan-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl mb-6 bg-[#111111] border border-white/10 text-white placeholder-gray-500 outline-none focus:border-cyan-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 transition-all duration-300 text-white py-4 rounded-xl font-semibold text-lg"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-gray-500 text-center mt-6">
          Already have an account?
          <Link
            to="/login"
            className="text-cyan-400 ml-2 hover:text-cyan-300"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  )
}