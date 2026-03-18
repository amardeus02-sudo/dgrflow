import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wwbvrhqeycokiojwzugg.supabase.co",
  "sb_publishable_cWTy7Bccrdn_Bn0kZY_-wQ_8nDVbWoX"
);

export default function Dashboard() {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);

    const { data, error } = await supabase.storage
      .from("sds-files")
      .upload(`public/${file.name}`, file);

    if (error) {
      alert("Erro no upload!");
      console.log(error);
    } else {
      alert("Upload realizado com sucesso!");
      console.log(data);
    }

    setUploading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Upload your SDS file below:</p>

      <input type="file" onChange={handleUpload} />

      {uploading && <p>Enviando arquivo...</p>}
    </div>
  );
}
