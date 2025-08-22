import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- AIRWINGS TRACKING ---------------- */
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
    console.log("Airwings Response:", data);

    const result = {
      status: "success",
      data: {
        awb: data?.Response?.Tracking?.[0]?.AWBNo || "",
        bookingDate: data?.Response?.Tracking?.[0]?.BookingDate || "",
        consignor: data?.Response?.Tracking?.[0]?.Consignor || "",
        consignee: data?.Response?.Tracking?.[0]?.Consignee || "",
        origin: data?.Response?.Tracking?.[0]?.Origin || "",
        destination: data?.Response?.Tracking?.[0]?.Destination || "",
        status: data?.Response?.Tracking?.[0]?.Status || "",
        deliveryDate: data?.Response?.Tracking?.[0]?.DeliveryDate || "",
        receiverName: data?.Response?.Tracking?.[0]?.ReceiverName || "",
        forwardingAWB: data?.Response?.Tracking?.[0]?.VendorAWBNo1 || "",
        history: (data?.Response?.Events || []).map(e => ({
          date: e.EventDate || "",
          time: e.EventTime || "",
          location: e.Location || "",
          status: e.Status || ""
        }))
      }
    };

    res.json(result);
  } catch (err) {
    console.error("Airwings API Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* ---------------- PACIFICEXP TRACKING ---------------- */
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
    console.log("PacificEXP Response:", data);

    const result = {
      status: "success",
      data: {
        awb: data?.Response?.Tracking?.[0]?.AWBNo || "",
        bookingDate: data?.Response?.Tracking?.[0]?.BookingDate || "",
        consignor: data?.Response?.Tracking?.[0]?.Consignor || "",
        consignee: data?.Response?.Tracking?.[0]?.Consignee || "",
        destination: data?.Response?.Tracking?.[0]?.Destination || "",
        serviceProvider: data?.Response?.Tracking?.[0]?.ServiceName || "",
        status: data?.Response?.Tracking?.[0]?.Status || "",
        deliveryDate: data?.Response?.Tracking?.[0]?.DeliveryDate || "",
        receiverName: data?.Response?.Tracking?.[0]?.ReceiverName || "",
        remark: data?.Response?.Tracking?.[0]?.Remark || "",
        history: (data?.Response?.Events || []).map(e => ({
          date: e.EventDate || "",
          time: e.EventTime || "",
          location: e.Location || "",
          status: e.Status || ""
        }))
      }
    };

    res.json(result);
  } catch (err) {
    console.error("PacificEXP API Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* ---------------- UNIVERSAL ENDPOINT ---------------- */
app.get("/track/:courier/:awb", (req, res) => {
  const { courier, awb } = req.params;
  if (courier === "airwings") return res.redirect(`/track/airwings/${awb}`);
  if (courier === "pacificexp") return res.redirect(`/track/pacificexp/${awb}`);
  res.status(400).json({ status: "error", message: "Unknown courier" });
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
