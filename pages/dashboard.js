import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wwbvrhqeycokiojwzugg.supabase.co",
  "sb_publishable_cWTy7Bccrdn_Bn0kZY_-wQ_8nDVbWoX"
);

export default function Dashboard() {
  const [productName, setProductName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file || !productName) {
      alert("Preencha todos os campos!");
      return;
    }

    setLoading(true);

    // 1. Upload do arquivo
    const { data: fileData, error: fileError } = await supabase.storage
      .from("sds-files")
      .upload(file.name, file);

    if (fileError) {
      alert("Erro no upload");
      console.log(fileError);
      setLoading(false);
      return;
    }

    // 2. Salvar no banco
    const { error: dbError } = await supabase.from("jobs").insert([
      {
        product_name: productName,
        file_name: file.name,
        status: "pending",
      },
    ]);

    if (dbError) {
      alert("Erro ao salvar job");
      console.log(dbError);
    } else {
      alert("Job criado com sucesso!");
      setProductName("");
      setFile(null);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Create Job</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
        <br /><br />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br /><br />

        <button type="submit">
          {loading ? "Sending..." : "Submit Job"}
        </button>
      </form>
    </div>
  );
}
