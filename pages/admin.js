import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Admin() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({});
  const [pdfReady, setPdfReady] = useState(false);

  useEffect(() => {
    init();
    loadPDF();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) return router.push("/login");

    if (data.user.email !== "amardeus02@gmail.com") {
      return router.push("/dashboard");
    }

    fetchJobs();
  }

  function loadPDF() {
    if (window.jspdf) {
      setPdfReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => setPdfReady(true);
    document.body.appendChild(script);
  }

  async function fetchJobs() {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs(data || []);
  }

  function handleChange(e, id) {
    setForm({
      ...form,
      [id]: {
        ...form[id],
        [e.target.name]: e.target.value
      }
    });
  }

  function autoClassify(data) {
    let result = { ...data };

    if (data.flammable === "yes") result.hazard_class = "3";
    if (data.aerosol === "yes") result.hazard_class = "2";

    const fp = parseFloat(data.flash_point);

    if (!isNaN(fp)) {
      if (fp < 23) result.packing_group = "II";
      else if (fp <= 60) result.packing_group = "III";
    }

    return result;
  }

  async function save(id) {
    if (!pdfReady) return alert("PDF loading...");

    let data = form[id];
    if (!data) return alert("Fill classification");

    data = autoClassify(data);
    const job = jobs.find(j => j.id === id);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 10;

    // HEADER
    doc.setFontSize(14);
    doc.text("Shipper’s Declaration for Dangerous Goods", 105, y, { align: "center" });

    y += 10;

    // SHIPPER / CONSIGNEE
    doc.rect(10, y, 90, 20);
    doc.text("Shipper", 12, y + 5);
    doc.text(job.company || "-", 12, y + 12);

    doc.rect(110, y, 90, 20);
    doc.text("Consignee", 112, y + 5);
    doc.text(job.customer_email || "-", 112, y + 12);

    y += 25;

    // TRANSPORT INFO
    doc.rect(10, y, 190, 10);
    doc.text("Transport Details", 12, y + 6);
    y += 15;

    // TABLE HEADER
    doc.rect(10, y, 190, 10);

    doc.text("UN", 12, y + 6);
    doc.text("Proper Shipping Name", 30, y + 6);
    doc.text("Class", 110, y + 6);
    doc.text("PG", 130, y + 6);
    doc.text("Qty", 150, y + 6);

    y += 10;

    // TABLE ROW
    doc.rect(10, y, 190, 10);

    doc.text(data.un_number || "-", 12, y + 6);
    doc.text(job.product_name || "-", 30, y + 6);
    doc.text(data.hazard_class || "-", 110, y + 6);
    doc.text(data.packing_group || "-", 130, y + 6);
    doc.text(job.quantity ? job.quantity.toString() : "-", 150, y + 6);

    y += 15;

    // EXTRA INFO
    doc.rect(10, y, 190, 25);

    doc.text(`EMS: ${data.ems || "-"}`, 12, y + 6);
    doc.text(`Limited Qty: ${data.limited_quantity || "-"}`, 12, y + 12);
    doc.text(`Flammable: ${data.flammable || "-"}`, 100, y + 6);
    doc.text(`Aerosol: ${data.aerosol || "-"}`, 100, y + 12);

    y += 30;

    // DECLARATION
    doc.rect(10, y, 190, 30);

    doc.setFontSize(9);
    doc.text(
      "I hereby declare that the contents of this consignment are fully and accurately described above and are in all respects in proper condition for transport according to applicable regulations.",
      12,
      y + 10,
      { maxWidth: 180 }
    );

    y += 35;

    // SIGNATURE
    doc.text("Name / Signature:", 12, y);
    doc.text("Date:", 150, y);

    const pdfBlob = doc.output("blob");
    const filePath = `result_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("results")
      .upload(filePath, pdfBlob);

    if (uploadError) return alert(uploadError.message);

    const { error } = await supabase
      .from("jobs")
      .update({
        ...data,
        result_file: filePath,
        status: "done"
      })
      .eq("id", id);

    if (error) return alert(error.message);

    alert("Shipping Paper gerado 🚀");

    fetchJobs();
  }

  return (
    <div style={{ padding: 40, color: "white" }}>
      <h1>Admin - DG Classification</h1>

      {jobs.map(job => (
        <div key={job.id} style={{ marginBottom: 30 }}>
          <h3>{job.product_name}</h3>

          <input name="un_number" placeholder="UN Number" onChange={(e) => handleChange(e, job.id)} />
          <input name="hazard_class" placeholder="Class" onChange={(e) => handleChange(e, job.id)} />
          <input name="packing_group" placeholder="PG" onChange={(e) => handleChange(e, job.id)} />
          <input name="ems" placeholder="EMS" onChange={(e) => handleChange(e, job.id)} />

          <select name="limited_quantity" onChange={(e) => handleChange(e, job.id)}>
            <option value="">LQ</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <select name="flammable" onChange={(e) => handleChange(e, job.id)}>
            <option value="">Flammable</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <select name="aerosol" onChange={(e) => handleChange(e, job.id)}>
            <option value="">Aerosol</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <button onClick={() => save(job.id)}>
            Generate Shipping Paper
          </button>
        </div>
      ))}
    </div>
  );
}
