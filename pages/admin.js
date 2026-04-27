import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Admin() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();

    if (!data?.user) return router.push("/login");

    if (data.user.email !== "amardeus02@gmail.com") {
      return router.push("/dashboard");
    }

    fetchJobs();
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
    let data = form[id];
    if (!data) return alert("Fill classification");

    data = autoClassify(data);
    const job = jobs.find(j => j.id === id);

    // 📄 HTML PROFISSIONAL IMO STYLE
    const html = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial;
          padding: 20px;
        }
        h1 {
          text-align: center;
        }
        .box {
          border: 1px solid black;
          padding: 10px;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td, th {
          border: 1px solid black;
          padding: 5px;
          font-size: 12px;
        }
        .small {
          font-size: 10px;
        }
      </style>
    </head>

    <body>

      <h1>Shipper’s Declaration for Dangerous Goods</h1>

      <div class="box">
        <strong>Shipper:</strong> ${job.company}<br/>
        <strong>Consignee:</strong> ${job.customer_email}
      </div>

      <div class="box">
        <strong>Transport:</strong> Passenger and Cargo Aircraft
      </div>

      <table>
        <tr>
          <th>UN</th>
          <th>Proper Shipping Name</th>
          <th>Class</th>
          <th>PG</th>
          <th>Qty</th>
        </tr>
        <tr>
          <td>${data.un_number || "-"}</td>
          <td>${job.product_name || "-"}</td>
          <td>${data.hazard_class || "-"}</td>
          <td>${data.packing_group || "-"}</td>
          <td>${job.quantity || "-"}</td>
        </tr>
      </table>

      <div class="box small">
        EMS: ${data.ems || "-"} <br/>
        Limited Quantity: ${data.limited_quantity || "-"} <br/>
        Flammable: ${data.flammable || "-"} <br/>
        Aerosol: ${data.aerosol || "-"} <br/>
        Flash Point: ${data.flash_point || "-"} °C
      </div>

      <div class="box small">
        I hereby declare that the contents of this consignment are fully and accurately described.
      </div>

      <div class="box">
        Signature: __________________________ <br/>
        Date: ______________________________
      </div>

    </body>
    </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const filePath = `result_${Date.now()}.html`;

    await supabase.storage.from("results").upload(filePath, blob);

    await supabase.from("jobs")
      .update({
        ...data,
        result_file: filePath,
        status: "done"
      })
      .eq("id", id);

    alert("Documento IMO style gerado 🚀");

    fetchJobs();
  }

  return (
    <div style={{ padding: 40 }}>
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
            Generate IMO Document
          </button>
        </div>
      ))}
    </div>
  );
}
