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
    const { data } = await supabase.from("jobs").select("*");
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

  async function generatePDF(id) {
    let data = form[id];
    if (!data) return alert("Fill classification");

    data = autoClassify(data);
    const job = jobs.find(j => j.id === id);

    const html = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial;
          font-size: 11px;
          padding: 15px;
        }

        .title {
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
        }

        .box {
          border: 1px solid black;
          padding: 5px;
          min-height: 40px;
        }

        .full {
          grid-column: span 2;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        th, td {
          border: 1px solid black;
          padding: 5px;
          text-align: left;
        }

        .footer {
          margin-top: 15px;
          border: 1px solid black;
          padding: 10px;
        }

        .signature {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
        }

        .sig-box {
          width: 45%;
          border-top: 1px solid black;
          padding-top: 5px;
          text-align: center;
        }
      </style>
    </head>

    <body>

      <div class="title">
        SHIPPER'S DECLARATION FOR DANGEROUS GOODS
      </div>

      <div class="grid">
        <div class="box">
          <strong>Shipper</strong><br/>
          ${job.company || "-"}
        </div>

        <div class="box">
          <strong>Consignee</strong><br/>
          ${job.customer_email || "-"}
        </div>

        <div class="box full">
          <strong>Transport Details</strong><br/>
          Passenger and Cargo Aircraft
        </div>
      </div>

      <table>
        <tr>
          <th>UN Number</th>
          <th>Proper Shipping Name</th>
          <th>Class</th>
          <th>Packing Group</th>
          <th>Quantity</th>
        </tr>

        <tr>
          <td>${data.un_number || "-"}</td>
          <td>${job.product_name || "-"}</td>
          <td>${data.hazard_class || "-"}</td>
          <td>${data.packing_group || "-"}</td>
          <td>${job.quantity || "-"}</td>
        </tr>
      </table>

      <div class="footer">
        EMS: ${data.ems || "-"} |
        Limited Quantity: ${data.limited_quantity || "-"} |
        Flammable: ${data.flammable || "-"} |
        Aerosol: ${data.aerosol || "-"} |
        Flash Point: ${data.flash_point || "-"} °C
      </div>

      <div class="footer">
        I hereby declare that the contents of this consignment are fully and accurately described above
        and are in all respects in proper condition for transport according to applicable regulations.
      </div>

      <div class="signature">
        <div class="sig-box">Name / Title</div>
        <div class="sig-box">Signature / Date</div>
      </div>

    </body>
    </html>
    `;

    const res = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ html })
    });

    const blob = await res.blob();
    const filePath = `result_${Date.now()}.pdf`;

    await supabase.storage.from("results").upload(filePath, blob);

    await supabase.from("jobs")
      .update({
        ...data,
        result_file: filePath,
        status: "done"
      })
      .eq("id", id);

    alert("IMO OFFICIAL PDF gerado 🚀");

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

          <button onClick={() => generatePDF(job.id)}>
            Generate Official PDF
          </button>
        </div>
      ))}
    </div>
  );
}
