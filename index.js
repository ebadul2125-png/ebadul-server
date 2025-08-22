import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------------- AIRWINGS TRACKING (FULL DETAILS + HISTORY) ---------------------- */
app.get("/track/airwings/:awb", async (req, res) => {
  const { awb } = req.params;

  try {
    const response = await fetch("http://cloud.airwingsindia.com/api/v1/Tracking/Tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        UserID: "CARD",
        Password: "CARD@71",
        AWBNo: awb,
        Type: "A",
        RequiredUrl: "yes"
      })
    });

    const data = await response.json();
    console.log("Airwings Response:", data); // LOG for debugging

    const result = {
      AWBNo: data?.Response?.Tracking?.[0]?.AWBNo || "",
      BookingDate: data?.Response?.Tracking?.[0]?.BookingDate || "",
      Consignor: data?.Response?.Tracking?.[0]?.Consignor || "",
      Consignee: data?.Response?.Tracking?.[0]?.Consignee || "",
      Origin: data?.Response?.Tracking?.[0]?.Origin || "",
      Destination: data?.Response?.Tracking?.[0]?.Destination || "",
      Status: data?.Response?.Tracking?.[0]?.Status || "",
      DeliveryDate: data?.Response?.Tracking?.[0]?.DeliveryDate || "",
      ReceiverName: data?.Response?.Tracking?.[0]?.ReceiverName || "",
      ForwardingAWB: data?.Response?.Tracking?.[0]?.VendorAWBNo1 || "",
      Events: (data?.Response?.Events || []).map(e => ({
        Date: e.EventDate || "",
        Time: e.EventTime || "",
        Location: e.Location || "",
        Status: e.Status || ""
      }))
    };

    res.json(result);
  } catch (err) {
    console.error("Airwings API Error:", err);
    res.status(500).json({ error: "Airwings API failed", details: err.message });
  }
});

/* ---------------------- PACIFICEXP TRACKING (FULL DETAILS + HISTORY) ---------------------- */
app.get("/track/pacificexp/:awb", async (req, res) => {
  const { awb } = req.params;

  try {
    const response = await fetch("https://eship.pacificexp.net/api/v1/Tracking/Tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        UserID: "test1",
        Password: "Test@2024#",
        AWBNo: awb,
        Type: "A",
        RequiredUrl: "yes"
      })
    });

    const data = await response.json();
    console.log("PacificEXP Response:", data); // LOG for debugging

    const result = {
      AWBNo: data?.Response?.Tracking?.[0]?.AWBNo || "",
      BookingDate: data?.Response?.Tracking?.[0]?.BookingDate || "",
      Consignor: data?.Response?.Tracking?.[0]?.Consignor || "",
      Consignee: data?.Response?.Tracking?.[0]?.Consignee || "",
      Destination: data?.Response?.Tracking?.[0]?.Destination || "",
      ServiceProvider: data?.Response?.Tracking?.[0]?.ServiceName || "",
      Status: data?.Response?.Tracking?.[0]?.Status || "",
      DeliveryDate: data?.Response?.Tracking?.[0]?.DeliveryDate || "",
      ReceiverName: data?.Response?.Tracking?.[0]?.ReceiverName || "",
      Remark: data?.Response?.Tracking?.[0]?.Remark || "",
      Events: (data?.Response?.Events || []).map(e => ({
        Date: e.EventDate || "",
        Time: e.EventTime || "",
        Location: e.Location || "",
        Status: e.Status || ""
      }))
    };

    res.json(result);
  } catch (err) {
    console.error("PacificEXP API Error:", err);
    res.status(500).json({ error: "PacificEXP API failed", details: err.message });
  }
});

/* ---------------------- UNIVERSAL ENDPOINT (SELECT COURIER) ---------------------- */
app.get("/track/:courier/:awb", (req, res) => {
  const { courier, awb } = req.params;
  if (courier === "airwings") return res.redirect(`/track/airwings/${awb}`);
  if (courier === "pacificexp") return res.redirect(`/track/pacificexp/${awb}`);
  return res.status(400).json({ error: "Unknown courier" });
});

/* ---------------------- START SERVER ---------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
