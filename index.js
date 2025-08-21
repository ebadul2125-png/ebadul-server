import express from "express";
import cors from "cors";
import fetch from "node-fetch";   // npm install node-fetch

const app = express();
app.use(cors());
app.use(express.json());

// Root route (Render test)
app.get("/", (req, res) => {
  res.send("✅ Ebadul Server is Running Successfully on Render!");
});

// Tracking route
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

    // 🔍 Debugging: Print full response to Render logs
    console.log("🔍 Raw Airwings Response:", JSON.stringify(data, null, 2));

    // JSON format clean karo
    let result = {
      awb: data?.Response?.Tracking?.[0]?.AWBNo || "Not Available",
      status: data?.Response?.Tracking?.[0]?.Status || "Not Available",
      bookingDate: data?.Response?.Tracking?.[0]?.BookingDate || "Not Available",
      origin: data?.Response?.Tracking?.[0]?.Origin || "Not Available",
      destination: data?.Response?.Tracking?.[0]?.Destination || "Not Available",
      deliveryDate: data?.Response?.Tracking?.[0]?.DeliveryDate || "Not Available",
      receiverName: data?.Response?.Tracking?.[0]?.ReceiverName || "Not Available",
      vendorAwb: data?.Response?.Tracking?.[0]?.VendorAWBNo1 || "Not Available",
      consignor: data?.Response?.Tracking?.[0]?.ConsignorName || "Not Available",
      consignee: data?.Response?.Tracking?.[0]?.ConsigneeName || "Not Available",
      progress: data?.Response?.Events || []
    };

    res.json(result);
  } catch (err) {
    console.error("❌ API Error:", err.message); // Debug error logs
    res.status(500).json({ error: "API call failed", details: err.message });
  }
});

// Render ka PORT use karo
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
