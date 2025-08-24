import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Helper Functions
function normalizeEvents(events = []) {
  return (Array.isArray(events) ? events : []).map(e => ({
    date: e?.EventDate ?? e?.date ?? "",
    time: e?.EventTime ?? e?.time ?? "",
    location: e?.Location ?? e?.location ?? "",
    status: e?.Status ?? e?.activity ?? "",
    remarks: e?.Remark ?? e?.remarks ?? ""
  }));
}

function normalizeTracking(tr) {
  return {
    awb: tr?.AWBNo ?? tr?.awbNo ?? "Not Available",
    bookingDate: tr?.BookingDate ?? tr?.bookingDate ?? "Not Available",
    consignor: tr?.Consignor ?? tr?.Shipper ?? "Not Available",
    consignee: tr?.Consignee ?? tr?.consigneeName ?? "Not Available",
    origin: tr?.Origin ?? "Not Available",
    destination: tr?.Destination ?? tr?.destination ?? "Not Available",
    status: tr?.Status ?? tr?.status ?? "Not Available",
    deliveryDate: tr?.DeliveryDate ?? tr?.deliveryDate ?? "Not Available",
    receiverName: tr?.ReceiverName ?? tr?.receiverName ?? "Not Available",
    vendorAwb:
      tr?.VendorAWBNo1 ?? tr?.VendorAWBNo2 ?? tr?.VendorAWBNo ?? tr?.forwardingNo ?? "Not Available",
    serviceProvider:
      tr?.ServiceName ?? tr?.VendorName ?? tr?.VendorName2 ?? "Not Available",
    trackingNumber:
      tr?.VendorAWBNo2 ?? tr?.VendorAWBNo1 ?? tr?.VendorAWBNo ?? "Not Available",
    remark: tr?.Remark ?? ""
  };
}

/* ================== AIRWINGS ================== */
app.get("/track/airwings/:awb", async (req, res) => {
  const { awb } = req.params;
  try {
    const resp = await fetch("http://cloud.airwingsindia.com/api/v1/Tracking/Tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        UserID: "CARD",
        Password: "CARD@71",
        AWBNo: awb,
        Type: "A",
        RequiredUrl: "yes"
      }),
      signal: AbortSignal.timeout(20000)
    });

    const data = await resp.json().catch(() => ({}));
    if (!data?.Response || data?.Response?.ErrorDisc === "AWB No not found") {
      return res.json({ success: true, carrier: "airwings", awb, data: null, progress: [] });
    }

    const tr = data.Response?.Tracking?.[0] ?? {};
    const events = data.Response?.Events ?? [];
    return res.json({
      success: true,
      carrier: "airwings",
      awb,
      data: normalizeTracking(tr),
      progress: normalizeEvents(events)
    });
  } catch (err) {
    return res.status(500).json({ success: false, carrier: "airwings", awb, error: err.message });
  }
});

/* ================== PACIFICEXP ================== */
app.get("/track/pacificexp/:awb", async (req, res) => {
  const { awb } = req.params;
  try {
    const resp = await fetch("https://eship.pacificexp.net/api/v1/Tracking/Tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        UserID: "test1",
        Password: "Test@2024#",
        AWBNo: awb,
        Type: "A",
        RequiredUrl: "yes"
      }),
      signal: AbortSignal.timeout(20000)
    });

    const data = await resp.json().catch(() => ({}));
    if (!data?.Response || data?.Response?.ErrorDisc === "AWB No not found") {
      return res.json({ success: true, carrier: "pacificexp", awb, data: null, progress: [] });
    }

    const tr = data.Response?.Tracking?.[0] ?? {};
    const events = data.Response?.Events ?? [];
    return res.json({
      success: true,
      carrier: "pacificexp",
      awb,
      data: normalizeTracking(tr),
      progress: normalizeEvents(events)
    });
  } catch (err) {
    return res.status(500).json({ success: false, carrier: "pacificexp", awb, error: err.message });
  }
});

/* ================== TLS (Mock Data) ================== */
const tlsTrackingData = {
  "29520947": {
    awbNo: "29520947",
    bookingDate: "20/8/2025",
    consigneeName: "ASMA SHAIKH",
    destination: "UNITED ARAB EMIRATES",
    pieces: 1,
    status: "INTRANSIT",
    deliveryDate: "",
    deliveryTime: "",
    receiverName: "",
    forwardingNo: "",
    deliveryInfo: [
      { date: "23/8/2025", time: "21:11", location: "Dubai", activity: "RETURN TO HUB", remarks: "" },
      { date: "23/8/2025", time: "20:11", location: "Dubai", activity: "NO RESPONSE", remarks: "" },
      { date: "23/8/2025", time: "08:31", location: "Dubai", activity: "OUT FOR DELIVERY", remarks: "" },
      { date: "23/8/2025", time: "07:21", location: "Dubai", activity: "RECEIVED AT HUB", remarks: "" },
      { date: "23/8/2025", time: "03:42", location: "Dubai", activity: "IN TRANSIT", remarks: "" },
      { date: "23/8/2025", time: "03:27", location: "Dubai", activity: "RECEIVED AT ECO/TEAM EXPRESS", remarks: "" },
      { date: "23/8/2025", time: "03:26", location: "Dubai", activity: "PICKED UP", remarks: "" },
      { date: "23/8/2025", time: "02:49", location: "Dubai", activity: "DATA UPLOADED", remarks: "" },
      { date: "21/8/2025", time: "15:44", location: "INDIA", activity: "SHIPMENT FORWARDED TO DESTINATION HUB", remarks: "RUN# 1697" },
      { date: "20/8/2025", time: "20:50", location: "HOJAI", activity: "SHIPMENT HAS BEEN BOOKED", remarks: "" }
    ]
  }
};

app.get("/track/tls/:awb", (req, res) => {
  const { awb } = req.params;
  const data = tlsTrackingData[awb];
  if (!data) {
    return res.json({ success: false, carrier: "tls", awb, error: "TLS AWB not found" });
  }
  return res.json({
    success: true,
    carrier: "tls",
    awb,
    data: normalizeTracking(data),
    progress: normalizeEvents(data.deliveryInfo)
  });
});

/* ================== START SERVER ================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
