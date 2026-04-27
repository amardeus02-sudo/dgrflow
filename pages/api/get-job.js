import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing job id" });
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
}
