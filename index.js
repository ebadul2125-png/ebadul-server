import express from "express";
import cors from "cors";
import fetch from "node-fetch";   // npm install node-fetch

const app = express();
app.use(cors());
app.use(express.json());

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

    // ✅ Extract main tracking data
    const track = data?.Response?.Tracking?.[0] || {};
    const events = data?.Response?.Events || [];

    let result = {
      awb: track.AWBNo || "Not Available",
      refNo: track.RefNo || "Not Available",
      status: track.Status || "Not Available",
      bookingDate: track.BookingDate || "Not Available",
      consignor: track.Consignor || "Not Available",   // ✅ Added
      consignee: track.Consignee || "Not Available",   // ✅ Added
      origin: track.Origin || "Not Available",
      destination: track.Destination || "Not Available",
      deliveryDate: track.DeliveryDate || "Not Available",
      receiverName: track.ReceiverName || "Not Available",
      vendorAwb: track.VendorAWBNo1 || "Not Available",
      progress: events
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "API call failed", details: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
