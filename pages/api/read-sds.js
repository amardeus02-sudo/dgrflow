async function handleSDSUpload(file) {
  try {
    console.log("STARTING SDS FLOW");

    if (!file) {
      throw new Error("No file selected");
    }

    // STEP 1 - CREATE JOB
    const createJobResponse = await fetch("/api/create-job", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const createJobData = await createJobResponse.json();

    console.log("CREATE JOB RESPONSE:", createJobData);

    if (!createJobResponse.ok) {
      throw new Error(
        createJobData?.error || "Failed to create job"
      );
    }

    const jobId = createJobData.id;

    if (!jobId) {
      throw new Error("Job ID was not returned");
    }

    console.log("JOB ID:", jobId);

    // STEP 2 - BUILD FORM DATA
    const formData = new FormData();

    formData.append("file", file);

    // STEP 3 - SEND PDF TO READ SDS API
    const readResponse = await fetch("/api/read-sds", {
      method: "POST",
      headers: {
        "x-job-id": String(jobId),
      },
      body: formData,
    });

    const readData = await readResponse.json();

    console.log("READ SDS RESPONSE:", readData);

    if (!readResponse.ok) {
      throw new Error(
        readData?.details ||
        readData?.error ||
        "Failed to process SDS"
      );
    }

    console.log("SDS SUCCESSFULLY PARSED");

    return {
      success: true,
      jobId,
      data: readData,
    };

  } catch (error) {
    console.error("HANDLE SDS ERROR:", error);

    return {
      success: false,
      error: error.message,
    };
  }
}
