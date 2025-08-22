import express from "express";
import cors from "cors";
import fetch from "node-fetch";   // install karo: npm install node-fetch

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------------- AIRWINGS TRACKING ---------------------- */
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

    const result = {
      awb: data?.Response?.Tracking?.[0]?.AWBNo || "Not Available",
      status: data?.Response?.Tracking?.[0]?.Status || "Not Available",
      bookingDate: data?.Response?.Tracking?.[0]?.BookingDate || "Not Available",
      origin: data?.Response?.Tracking?.[0]?.Origin || "Not Available",
      destination: data?.Response?.Tracking?.[0]?.Destination || "Not Available",
      deliveryDate: data?.Response?.Tracking?.[0]?.DeliveryDate || "Not Available",
      receiverName: data?.Response?.Tracking?.[0]?.ReceiverName || "Not Available",
      vendorAwb: data?.Response?.Tracking?.[0]?.VendorAWBNo1 || "Not Available",
      progress: data?.Response?.Events || []
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Airwings API failed", details: err.message });
  }
});

/* ---------------------- PACIFICEXP TRACKING ---------------------- */
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

    const result = {
      awb: data?.Response?.Tracking?.[0]?.AWBNo || "Not Available",
      status: data?.Response?.Tracking?.[0]?.Status || "Not Available",
      bookingDate: data?.Response?.Tracking?.[0]?.BookingDate || "Not Available",
      destination: data?.Response?.Tracking?.[0]?.Destination || "Not Available",
      deliveryDate: data?.Response?.Tracking?.[0]?.DeliveryDate || "Not Available",
      receiverName: data?.Response?.Tracking?.[0]?.ReceiverName || "Not Available",
      serviceProvider: data?.Response?.Tracking?.[0]?.ServiceName || "Not Available",
      progress: data?.Response?.Events || []
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "PacificEXP API failed", details: err.message });
  }
});

/* ---------------------- START SERVER ---------------------- */
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
