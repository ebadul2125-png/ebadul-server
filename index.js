import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// --------- Airwings Tracking ----------
async function getAirwingsData(awb) {
    try {
        const res = await fetch(`https://your-airwings-api-url/${awb}`); // <-- Actual API endpoint
        const json = await res.json();

        return {
            success: true,
            source: "Airwings",
            awb: json.awb || awb,
            bookingDate: json.bookingDate || "",
            consignor: json.consignor || "",
            consignee: json.consignee || "",
            origin: json.origin || "",
            destination: json.destination || "",
            status: json.status || "",
            deliveryDate: json.deliveryDate || "",
            receiver: json.receiver || "",
            progress: json.history?.map(h => ({
                date: h.date,
                time: h.time,
                location: h.location,
                status: h.status
            })) || []
        };
    } catch (err) {
        return { success: false, source: "Airwings", error: err.message };
    }
}

// --------- PacificEXP Tracking ----------
async function getPacificExpData(awb) {
    try {
        const res = await fetch("https://eship.pacificexp.net/api/v1/Tracking/Tracking", {
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

        const data = await res.json();
        if (!data || data.Response?.ErrorDisc !== "Success") {
            return { success: false, source: "PacificEXP", error: "AWB Not Found" };
        }

        const tracking = data.Response.Tracking[0] || {};
        const events = data.Response.Events || [];

        return {
            success: true,
            source: "PacificEXP",
            awb: tracking.AWBNo || awb,
            bookingDate: tracking.BookingDate || "",
            consignor: tracking.Consignor || "",
            consignee: tracking.Consignee || "",
            origin: tracking.Origin || "",
            destination: tracking.Destination || "",
            status: tracking.Status || "",
            deliveryDate: tracking.DeliveryDate || "",
            receiver: tracking.ReceiverName || "",
            progress: events.map(e => ({
                date: e.EventDate,
                time: e.EventTime,
                location: e.Location,
                status: e.Status
            }))
        };
    } catch (err) {
        return { success: false, source: "PacificEXP", error: err.message };
    }
}

// --------- Main Route (Combined) ----------
app.get("/track/:awb", async (req, res) => {
    const { awb } = req.params;

    const [airwings, pacific] = await Promise.all([
        getAirwingsData(awb),
        getPacificExpData(awb)
    ]);

    res.json({ airwings, pacific });
});

// --------- Server Start ----------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
