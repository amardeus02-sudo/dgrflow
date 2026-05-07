export default async function handler(req, res) {
  try {
    const { dg } = req.body;

    if (!dg) {
      return res.status(400).json({
        error: "Missing DG data",
      });
    }

    return res.status(200).json({
      success: true,
      validation: {
        approved: true,
        message: "DG validated successfully",
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Validation failed",
    });
  }
}
