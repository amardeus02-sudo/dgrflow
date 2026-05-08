import { useState } from "react";

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const [sdsText, setSdsText] = useState("");

  const [sdsData, setSdsData] = useState(null);

  const [classificationResult, setClassificationResult] = useState(null);

  const [validationResult, setValidationResult] = useState(null);

  const [extractionResult, setExtractionResult] = useState({
    unNumber: "N/A",
    hazardClass: "N/A",
    packingGroup: "N/A",
    shippingName: "N/A",
    marinePollutant: "N/A",
    tunnelCode: "N/A",
  });

  // =========================
  // FILE UPLOAD
  // =========================

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);

    setSdsText("");
    setSdsData(null);
    setClassificationResult(null);
    setValidationResult(null);
  };

  // =========================
  // READ SDS
  // =========================

  const handleReadSDS = async () => {
    if (!selectedFile) {
      alert("Please upload an SDS PDF first.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch("/api/read-sds", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log("READ SDS RESPONSE:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to read SDS");
      }

      setSdsText(data.text || "");

      setSdsData(data);

      setExtractionResult({
        unNumber: data.un_number || "N/A",
        hazardClass: data.hazard_class || "N/A",
        packingGroup: data.packing_group || "N/A",
        shippingName: data.shipping_name || "N/A",
        marinePollutant: data.marine_pollutant || "No",
        tunnelCode: data.tunnel_code || "N/A",
      });

      alert("SDS extracted successfully!");
    } catch (error) {
      console.error(error);

      alert("SDS extraction failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CLASSIFY DG
  // =========================

  const handleClassifyDG = async () => {
    if (!sdsData) {
      alert("Please read the SDS first.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sdsData),
      });

      const data = await response.json();

      console.log("CLASSIFICATION RESPONSE:", data);

      if (!response.ok) {
        throw new Error(data.error || "Classification failed");
      }

      setClassificationResult(data);

      alert("DG classified successfully!");
    } catch (error) {
      console.error(error);

      alert("Classification failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // VALIDATE DG
  // =========================

  const handleValidateDG = async () => {
    if (!classificationResult) {
      alert("Please classify DG first.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(classificationResult),
      });

      const data = await response.json();

      console.log("VALIDATION RESPONSE:", data);

      if (!response.ok) {
        throw new Error(data.error || "Validation failed");
      }

      setValidationResult(data);

      alert("DG validation completed!");
    } catch (error) {
      console.error(error);

      alert("DG validation failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GENERATE IMO PDF
  // =========================

  const handleGenerateIMO = async () => {
    if (!validationResult) {
      alert("Please validate DG first.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sds: sdsData,
          classification: classificationResult,
          validation: validationResult,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate IMO PDF");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = "IMO_Document.pdf";

      document.body.appendChild(a);

      a.click();

      a.remove();

      window.URL.revokeObjectURL(url);

      alert("IMO PDF generated successfully!");
    } catch (error) {
      console.error(error);

      alert("IMO PDF generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="border-b border-zinc-800 bg-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-orange-500">
              DGRFlow
            </h1>

            <p className="text-xs text-zinc-400">
              Dangerous Goods Automation
            </p>
          </div>

          <button className="bg-orange-500 hover:bg-orange-600 transition px-5 py-2 rounded-xl text-sm font-semibold">
            Upgrade Plan
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-xs mb-6">
          AI Dangerous Goods Platform
        </div>

        <h2 className="text-5xl font-extrabold leading-tight max-w-3xl">
          Automate SDS extraction, DG validation and IMO generation.
        </h2>

        <p className="text-zinc-400 text-lg mt-6 max-w-2xl">
          Upload Safety Data Sheets and automatically extract transport data with AI.
        </p>
      </section>

      {/* MAIN GRID */}
      <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* UPLOAD CARD */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <h3 className="text-xl font-bold mb-6">
              Upload SDS
            </h3>

            <div className="border border-dashed border-zinc-700 rounded-2xl p-10 text-center">

              <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-5">
                📄
              </div>

              <h4 className="text-2xl font-bold mb-3">
                Drag & Drop SDS PDF
              </h4>

              <p className="text-zinc-400 mb-6">
                Upload dangerous goods Safety Data Sheets
              </p>

              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="mb-4"
              />

              {selectedFile && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-4 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {selectedFile.name}
                      </p>

                      <p className="text-sm text-zinc-400">
                        PDF ready for processing
                      </p>
                    </div>

                    <span className="text-green-400 font-semibold text-sm">
                      READY
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-4 mt-6">

              <button
                onClick={handleReadSDS}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 transition px-5 py-3 rounded-xl font-semibold"
              >
                Read SDS
              </button>

              <button
                onClick={handleClassifyDG}
                disabled={loading}
                className="bg-purple-500 hover:bg-purple-600 transition px-5 py-3 rounded-xl font-semibold"
              >
                Classify DG
              </button>

              <button
                onClick={handleValidateDG}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 transition px-5 py-3 rounded-xl font-semibold"
              >
                Validate DG
              </button>

              <button
                onClick={handleGenerateIMO}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 transition px-5 py-3 rounded-xl font-semibold"
              >
                Generate IMO PDF
              </button>

            </div>
          </div>

          {/* SDS RESULTS */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <h3 className="text-3xl font-bold mb-8">
              SDS Extraction Results
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-zinc-500 text-sm mb-2">
                  UN NUMBER
                </p>

                <h4 className="text-4xl font-bold text-orange-400">
                  {extractionResult.unNumber}
                </h4>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-zinc-500 text-sm mb-2">
                  HAZARD CLASS
                </p>

                <h4 className="text-4xl font-bold text-pink-400">
                  {extractionResult.hazardClass}
                </h4>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-zinc-500 text-sm mb-2">
                  PACKING GROUP
                </p>

                <h4 className="text-4xl font-bold text-green-400">
                  {extractionResult.packingGroup}
                </h4>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-zinc-500 text-sm mb-2">
                  SHIPPING NAME
                </p>

                <h4 className="text-2xl font-bold text-white">
                  {extractionResult.shippingName}
                </h4>
              </div>

            </div>
          </div>

          {/* CLASSIFICATION */}
          {classificationResult && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-3xl font-bold mb-6">
                DG Classification
              </h3>

              <pre className="bg-zinc-900 p-4 rounded-2xl overflow-auto text-sm">
                {JSON.stringify(classificationResult, null, 2)}
              </pre>
            </div>
          )}

          {/* VALIDATION */}
          {validationResult && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-3xl font-bold mb-6">
                DG Validation
              </h3>

              <pre className="bg-zinc-900 p-4 rounded-2xl overflow-auto text-sm">
                {JSON.stringify(validationResult, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <h3 className="text-xl font-bold mb-5">
              Platform Status
            </h3>

            <div className="space-y-4 text-sm">

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  AI Extraction
                </span>

                <span className="text-green-400 font-bold">
                  ONLINE
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  DG Validation
                </span>

                <span className="text-green-400 font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  IMO Generator
                </span>

                <span className="text-green-400 font-bold">
                  READY
                </span>
              </div>

            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6">

            <h3 className="text-2xl font-bold mb-4">
              Enterprise Plan
            </h3>

            <p className="text-sm text-orange-100 mb-5">
              Unlock unlimited SDS processing, AI classification and PDF automation.
            </p>

            <button className="bg-white text-black font-bold px-5 py-3 rounded-xl">
              Upgrade
            </button>

          </div>

        </div>

      </section>
    </div>
  );
}
