import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "COLE_AQUI_SUA_URL",
  "COLE_AQUI_SUA_KEY"
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
