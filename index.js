// required modules ko import karein
import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // node-fetch version 3.x
import axios from "axios";
import * as cheerio from "cheerio";
import * as XLSX from "xlsx";

// express application ko initialize karein
const app = express();
app.use(cors()); // CORS ko enable karein
app.use(express.json()); // JSON body ko parse karne ke liye

// ============ Helper Functions (Madadgar Functions) ============
// yah function events ko normalize karta hai
function normalizeEvents(events = []) {
  return (Array.isArray(events) ? events : []).map(e => ({
    date: e?.EventDate ?? e?.date ?? "",
    time: e?.EventTime ?? e?.time ?? "",
    location: e?.Location ?? e?.location ?? "",
    status: e?.Status ?? e?.activity ?? "",
    remarks: e?.Remark ?? e?.remarks ?? ""
  }));
}

// yah function tracking data ko normalize karta hai
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

// TLS ke liye helper function
function getValue(infoArr, key) {
  if (!Array.isArray(infoArr)) return "Not Available";
  const row = infoArr.find(i => i[0] === key);
  return row ? row[1] : "Not Available";
}

// ===================== API Routes =====================

/* ============== AIRWINGS ============== */
// airwings API se tracking data fetch karne ke liye route
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

/* ============== PACIFICEXP ============== */
// pacificexp API se tracking data fetch karne ke liye route
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

/* ============== TLS ============== */
// TLS API se tracking data fetch karne ke liye route
app.get('/track/tls/:awb', async (req, res) => {
  try {
    const { awb } = req.params;
    const url = `https://tlc.itdservices.in/api/tracking_api/get_tracking_data?tracking_no=${awb}&customer_code=superadmin&company=tlc&api_company_id=5`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'User-Agent': 'Mozilla/5.0 (Node.js Server)'
      }
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.json({ success: false, error: 'Invalid JSON from TLS API' });
    }

    if (Array.isArray(data) && data.length > 0 && !data[0].errors) {
      const d = data[0];
      res.json({
        success: true,
        carrier: 'tls',
        awb: d.tracking_no,
        data: {
          awb: d.tracking_no,
          bookingDate: getValue(d.docket_info, "Booking Date"),
          consignor: getValue(d.docket_info, "Go Fast Cargo and Couriers
"),
          consignee: getValue(d.docket_info, "Consignee Name"),
          origin: getValue(d.docket_info, "Origin"),
          destination: getValue(d.docket_info, "Destination"),
          status: getValue(d.docket_info, "Status"),
          deliveryDate: getValue(d.docket_info, "Delivery Date and Time"),
          receiverName: getValue(d.docket_info, "Receiver Name"),
          vendorAwb: getValue(d.docket_info, "Forwarding No."),
        },
        progress: (d.docket_events || []).map(e => ({
          date: e.event_at?.split(' ')[0] || '',
          time: e.event_at?.split(' ')[1] || '',
          location: e.event_location || '',
          status: e.event_description || ''
        }))
      });
    } else {
      res.json({ success: false, carrier: 'tls', awb, error: 'TLS AWB not found' });
    }
  } catch (err) {
    res.json({ success: false, carrier: 'tls', error: err.message });
  }
});

/* ============== Axios Example ============== */
// is route par axios ka istemal karke data fetch karenge
app.get("/axios-example", async (req, res) => {
  try {
    const response = await axios.get("https://jsonplaceholder.typicode.com/posts/1");
    res.json({
      message: "Data fetched using Axios",
      data: response.data
    });
  } catch (error) {
    res.status(500).json({ error: "Axios request failed" });
  }
});

/* ============== Cheerio Example ============== */
// is route par cheerio ka istemal karke web scraping karenge
app.get("/cheerio-example", async (req, res) => {
  try {
    const { data } = await axios.get("https://en.wikipedia.org/wiki/Web_scraping");
    const $ = cheerio.load(data);
    const pageTitle = $("h1").text(); // page ka title nikaalein
    const firstParagraph = $("p").first().text(); // pehla paragraph nikaalein

    res.json({
      message: "Data scraped using Cheerio",
      pageTitle,
      firstParagraph
    });
  } catch (error) {
    res.status(500).json({ error: "Cheerio web scraping failed" });
  }
});

/* ============== XLSX Example ============== */
// is route par XLSX ka istemal karke Excel file banayenge
app.get("/xlsx-example", (req, res) => {
  const data = [
    { Name: "John Doe", Age: 30, City: "New York" },
    { Name: "Jane Smith", Age: 25, City: "London" }
  ];

  const ws = XLSX.utils.json_to_sheet(data); // JSON data se worksheet banayein
  const wb = XLSX.utils.book_new(); // ek naya workbook banayein
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1"); // workbook mein worksheet jodein

  // Excel file ko buffer mein convert karein
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // Response headers set karein Excel file bhejne ke liye
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + "data.xlsx"
  );

  res.send(buffer);
});

// ===================== Server Setup =====================

// server ko start karein
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log('✅ Tracking routes are active: /track/airwings/:awb, /track/pacificexp/:awb, /track/tls/:awb');
  console.log('✅ Example routes are active: /axios-example, /cheerio-example, /xlsx-example');
});
