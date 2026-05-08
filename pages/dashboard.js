import { useState } from "react";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [sdsText, setSdsText] = useState("");
const [classification, setClassification] = useState(null);
const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleReadSDS() {
    if (!file) {
      alert("Upload a PDF first");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/read-sds", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Read SDS failed");
        return;
      }

      setResult(data);

    } catch (err) {
      console.error(err);
      alert("Error reading SDS");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      
      {/* HEADER */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-orange-500 flex items-center justify-center font-black text-xl">
              D
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                DGRFlow
              </h1>

              <p className="text-zinc-400 text-sm">
                Dangerous Goods Automation
              </p>
            </div>
          </div>

          <button className="bg-orange-500 hover:bg-orange-600 transition px-5 py-3 rounded-2xl font-medium">
            Upgrade Plan
          </button>

        </div>
      </header>

      {/* CONTENT */}
      <section className="max-w-7xl mx-auto px-6 py-14">

        {/* HERO */}
        <div className="mb-12">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-6">
            AI Dangerous Goods Platform
          </div>

          <h2 className="text-5xl font-black leading-tight max-w-4xl">
            Automate SDS extraction,
            DG validation and IMO generation.
          </h2>

          <p className="mt-6 text-zinc-400 text-xl max-w-3xl">
            Upload Safety Data Sheets and automatically extract transport data with AI.
          </p>

        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">

            {/* UPLOAD */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">

              <h3 className="text-2xl font-bold mb-6">
                Upload SDS
              </h3>

              <label className="border-2 border-dashed border-zinc-700 rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:border-orange-500 transition cursor-pointer">

                <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-4xl mb-6">
                  📄
                </div>

                <h4 className="text-2xl font-bold mb-3">
                  Drag & Drop SDS PDF
                </h4>

                <p className="text-zinc-400 mb-6">
                  Upload dangerous goods Safety Data Sheets
                </p>

                <div className="bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-2xl font-semibold">
                  Select PDF
                </div>

                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>

              {file && (
                <div className="mt-6 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  
                  <div className="flex items-center justify-between">
                    
                    <div>
                      <p className="font-semibold">
                        {file.name}
                      </p>

                      <p className="text-sm text-zinc-400">
                        PDF ready for processing
                      </p>
                    </div>

                    <div className="text-green-400 font-semibold">
                      READY
                    </div>

                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex flex-wrap gap-4 mt-8">

                <button
                  onClick={handleReadSDS}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 transition px-6 py-4 rounded-2xl font-semibold"
                >
                  {loading ? "Reading..." : "Read SDS"}
                </button>

                <button className="bg-purple-500 hover:bg-purple-600 transition px-6 py-4 rounded-2xl font-semibold">
                  Classify DG
                </button>

                <button className="bg-green-500 hover:bg-green-600 transition px-6 py-4 rounded-2xl font-semibold">
                  Validate DG
                </button>

                <button className="bg-orange-500 hover:bg-orange-600 transition px-6 py-4 rounded-2xl font-semibold">
                  Generate IMO PDF
                </button>

              </div>
            </div>

            {/* RESULTS */}
            {result && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
                
                <h3 className="text-3xl font-black mb-8">
                  SDS Extraction Results
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <p className="text-zinc-400 text-sm mb-2">
                      UN NUMBER
                    </p>

                    <p className="text-3xl font-black text-orange-400">
                      {result.extracted?.un_number || "N/A"}
                    </p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <p className="text-zinc-400 text-sm mb-2">
                      HAZARD CLASS
                    </p>

                    <p className="text-3xl font-black text-red-400">
                      {result.extracted?.hazard_class || "N/A"}
                    </p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <p className="text-zinc-400 text-sm mb-2">
                      PACKING GROUP
                    </p>

                    <p className="text-3xl font-black text-green-400">
                      {result.extracted?.packing_group || "N/A"}
                    </p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <p className="text-zinc-400 text-sm mb-2">
                      SHIPPING NAME
                    </p>

                    <p className="text-xl font-bold">
                      {result.extracted?.proper_shipping_name || "N/A"}
                    </p>
                  </div>

                </div>

                {/* SECTION 14 */}
                <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  
                  <p className="text-zinc-400 text-sm mb-4">
                    SECTION 14
                  </p>

                  <pre className="whitespace-pre-wrap text-zinc-300 text-sm leading-relaxed">
                    {result.extracted?.section_14}
                  </pre>
                </div>

              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-8">

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
              
              <h3 className="text-xl font-bold mb-6">
                Platform Status
              </h3>

              <div className="space-y-4">

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    AI Extraction
                  </span>

                  <span className="text-green-400 font-semibold">
                    ONLINE
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    DG Validation
                  </span>

                  <span className="text-green-400 font-semibold">
                    ACTIVE
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    IMO Generator
                  </span>

                  <span className="text-green-400 font-semibold">
                    READY
                  </span>
                </div>

              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8">
              
              <h3 className="text-2xl font-black mb-4">
                Enterprise Plan
              </h3>

              <p className="text-orange-100 leading-relaxed">
                Unlock unlimited SDS processing, AI classification and PDF automation.
              </p>

              <button className="mt-6 bg-white text-black px-6 py-3 rounded-2xl font-bold">
                Upgrade
              </button>

            </div>

          </div>

        </div>
      </section>
    </main>
  );
}
