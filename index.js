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

/* ================== TLS REAL API ================== */
app.get("/track/tls/:awb", async (req, res) => {
  const { awb } = req.params;
  const url = `https://tlc.itdservices.in/api/tracking_api/get_tracking_data?tracking_no=${awb}&customer_code=superadmin&company=tlc&api_company_id=5`;

  try {
    const resp = await fetch(url);
    const json = await resp.json();

    if (!json || !Array.isArray(json) || json.length === 0) {
      return res.json({ success: false, carrier: "tls", awb, error: "No data found" });
    }

    const data = json[0]; // Main object
    const docketInfo = Object.fromEntries(data.docket_info || []);

    // **Main Tracking Data (Mapped)**
    const trackingData = {
      awb: data.tracking_no || awb,
      bookingDate: docketInfo["Booking Date"] || "Not Available",
      consignor: docketInfo["Shipper Company"] || docketInfo["Shipper Name"] || "Not Available",
      consignee: docketInfo["Consignee Name"] || docketInfo["Consignee Company"] || "Not Available",
      origin: docketInfo["Origin"] || docketInfo["Origin Hub"] || "Not Available",
      destination: docketInfo["Destination"] || docketInfo["Consignee Country"] || "Not Available",
      status: docketInfo["Status"] || "Not Available",
      deliveryDate: docketInfo["Delivery Date and Time"] || "",
      receiverName: docketInfo["Receiver Name"] || "",
      vendorAwb: docketInfo["Forwarding No."] || "Not Available",
      serviceProvider: docketInfo["Service Name"] || "TLS",
      trackingNumber: data.tracking_no || awb,
      remark: docketInfo["Delivery Remark"] || ""
    };

    // **Events Mapping**
    const events = (data.docket_events || []).map(e => ({
      date: (e.event_at || "").split(" ")[0],
      time: (e.event_at || "").split(" ")[1] || "",
      location: e.event_location || "",
      status: e.event_description || "",
      remarks: e.event_remark || ""
    }));

    return res.json({
      success: true,
      carrier: "tls",
      awb,
      data: trackingData,
      progress: events
    });

  } catch (err) {
    return res.status(500).json({ success: false, carrier: "tls", awb, error: err.message });
  }
});




/* ================== START SERVER ================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
