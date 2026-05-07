async function uploadSDS(file, jobId) {
  try {
    console.log("START SDS UPLOAD");
    console.log("JOB ID:", jobId);

    if (!jobId) {
      throw new Error("Missing jobId before SDS upload");
    }

    if (!file) {
      throw new Error("No file selected");
    }

    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch("/api/read-sds", {
      method: "POST",
      headers: {
        "x-job-id": String(jobId),
      },
      body: formData,
    });

    const result = await response.json();

    console.log("READ SDS RESPONSE:", result);

    if (!response.ok) {
      throw new Error(
        result?.error ||
        result?.details ||
        "Failed to read SDS"
      );
    }

    return result;

  } catch (err) {
    console.error("UPLOAD SDS ERROR:", err);

    throw err;
  }
}
