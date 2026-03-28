import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={container}>
      
      {/* ANIMAÇÃO GLOBAL */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      {/* LEFT */}
      <div style={left}>
        
        <div style={logoWrapper}>
          <img src="/logo.png" style={logo} />
          <div style={glow}></div>
        </div>

        <h1 style={title}>DGRFlow</h1>

        <p style={subtitle}>
          Automate Dangerous Goods Classification from SDS files.
        </p>
      </div>

      {/* RIGHT */}
      <div style={right}>
        <form onSubmit={handleLogin} style={form}>
          <h2>Welcome back</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />

          <button style={button}>
            Login 🚀
          </button>

          <p style={{ marginTop: 15, opacity: 0.6 }}>
            Don’t have an account? Just try logging in 😉
          </p>
        </form>
      </div>
    </div>
  );
}

/* 🎨 STYLES */

const container = {
  display: "flex",
  minHeight: "100vh",
  fontFamily: "Arial"
};

const left = {
  flex: 1,
  background: "#0f172a",
  color: "white",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: 40,
  position: "relative"
};

const right = {
  flex: 1,
  background: "#020617",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const form = {
  width: 340,
  background: "#0f172a",
  padding: 30,
  borderRadius: 16,
  color: "white",
  boxShadow: "0 0 40px rgba(0,0,0,0.6)"
};

const input = {
  width: "100%",
  padding: 12,
  marginTop: 10,
  borderRadius: 8,
  border: "none"
};

const button = {
  marginTop: 15,
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(90deg, #a855f7, #6366f1)",
  color: "white",
  cursor: "pointer"
};

/* 🦄 LOGO PREMIUM */

const logoWrapper = {
  position: "relative",
  marginBottom: 30
};

const logo = {
  height: 160,
  position: "relative",
  zIndex: 2,
  animation: "float 4s ease-in-out infinite"
};

const glow = {
  position: "absolute",
  width: 320,
  height: 320,
  background: "radial-gradient(circle, rgba(168,85,247,0.6), transparent)",
  filter: "blur(90px)",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: 1
};

const title = {
  fontSize: 36,
  background: "linear-gradient(90deg, #a855f7, #6366f1)",
  WebkitBackgroundClip: "text",
  color: "transparent"
};

const subtitle = {
  opacity: 0.7,
  marginTop: 10,
  textAlign: "center"
};
