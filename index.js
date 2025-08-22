import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// ---------- Airwings Tracking ----------
async function getAirwingsData(awb) {
  try {
    const res = await fetch(`https://www.airwingsindia.com/track/${awb}`); // Example scraping/API
    const json = await res.json();

    return {
      awb: json.awb || awb,
      refNo: json.refNo || "",
      bookingDate: json.bookingDate || "",
      consignor: json.consignor || "",
      consignee: json.consignee || "",
      origin: json.origin || "",
      destination: json.destination || "",
      status: json.status || "",
      deliveryDate: json.deliveryDate || "",
      receiverName: json.receiverName || "",
      vendorAwb: json.vendorAwb || "",
      progress: json.history?.map(h => ({
        EventDate: h.date,
        EventTime: h.time,
        Location: h.location,
        Status: h.status
      })) || []
    };
  } catch (err) {
    return { error: "Airwings fetch failed" };
  }
}

// ---------- PacificEXP Tracking ----------
async function getPacificExpData(awb) {
  try {
    const res = await fetch(`https://www.pacificexpress.com/track/${awb}`); // Example API endpoint
    const json = await res.json();

    return {
      awb: json.awb || awb,
      refNo: json.refNo || "",
      bookingDate: json.bookingDate || "",
      consignor: json.consignor || "",
      consignee: json.consignee || "",
      origin: json.origin || "",
      destination: json.destination || "",
      status: json.status || "",
      deliveryDate: json.deliveryDate || "",
      receiverName: json.receiverName || "",
      vendorAwb: json.vendorAwb || "",
      progress: json.history?.map(h => ({
        EventDate: h.date,
        EventTime: h.time,
        Location: h.location,
        Status: h.status
      })) || []
    };
  } catch (err) {
    return { error: "PacificEXP fetch failed" };
  }
}

// ---------- Combined API ----------
app.get("/track/:awb", async (req, res) => {
  const { awb } = req.params;

  const airwings = await getAirwingsData(awb);
  const pacific = await getPacificExpData(awb);

  res.json({ airwings, pacific });
});

// ---------- Server Start ----------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
