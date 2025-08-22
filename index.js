import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get("/health", (req, res) => res.json({ ok: true }));

// ---------- Helpers ----------
function normalizeEvents(events = []) {
  return (Array.isArray(events) ? events : []).map(e => ({
    date: e?.EventDate ?? "",
    time: e?.EventTime ?? "",
    location: e?.Location ?? "",
    status: e?.Status ?? ""
  }));
}

function normalizeTracking(tr) {
  return {
    awb: tr?.AWBNo ?? "Not Available",
    bookingDate: tr?.BookingDate ?? "Not Available",
    consignor: tr?.Consignor ?? tr?.Shipper ?? "Not Available",
    consignee: tr?.Consignee ?? "Not Available",
    origin: tr?.Origin ?? "Not Available",
    destination: tr?.Destination ?? "Not Available",
    status: tr?.Status ?? "Not Available",
    deliveryDate: tr?.DeliveryDate ?? "Not Available",
    receiverName: tr?.ReceiverName ?? "Not Available",
    vendorAwb:
      tr?.VendorAWBNo1 ?? tr?.VendorAWBNo2 ?? tr?.VendorAWBNo ?? "Not Available",
    serviceProvider:
      tr?.ServiceName ?? tr?.VendorName ?? tr?.VendorName2 ?? "Not Available",
    trackingNumber:
      tr?.VendorAWBNo2 ?? tr?.VendorAWBNo1 ?? tr?.VendorAWBNo ?? "Not Available",
    remark: tr?.Remark ?? ""
  };
}

// ---------- Airwings ----------
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
      // 20s timeout via AbortController
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

// ---------- PacificExp (official API used by their site) ----------
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

// -------------- Start Server --------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
