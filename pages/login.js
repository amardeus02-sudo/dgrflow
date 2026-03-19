import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";

const supabase = createClient(
  "https://wwbvrhqeycokiojwzugg.supabase.co",
  "sb_publishable_cWTy7Bccrdn_Bn0kZY_-wQ_8nDVbWoX"
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Erro no login");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Senha"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
