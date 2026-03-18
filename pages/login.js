import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
 sb_publishable_cWTy7Bccrdn_Bn0kZY_-wQ_8nDVbWoX,
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3YnZyaHFleWNva2lvand6dWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTkzMjMsImV4cCI6MjA4OTQzNTMyM30.oOeX804nsZbggFhKmNMfappHtzOnwcnRYxqTlq75bVk
);

export default function Login() {
  const [email, setEmail] = useState("");

  const handleLogin = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert("Check your email!");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Login</h2>
      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
