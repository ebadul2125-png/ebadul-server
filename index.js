import fetch from 'node-fetch';

// AIRWINGS API FUNCTION (Fixed with original endpoint)
export async function getAirwingsTracking(awb) {
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
      }),
    });

    const data = await response.json();

    if (!data?.Response || data.Response.ErrorDisc !== "Success") {
      return { success: false, error: "Airwings AWB not found" };
    }

    return {
      success: true,
      provider: "Airwings",
      awb: awb,
      details: data.Response.Tracking[0] || {},
      history: data.Response.Events || []
    };

  } catch (err) {
    console.error("Airwings API Error:", err);
    return { success: false, error: "Error fetching Airwings data" };
  }
}

// PACIFICEXP API FUNCTION (unchanged)
export async function getPacificExpTracking(awb) {
  try {
    const reqObj = {
      UserID: "test1",
      Password: "Test@2024#",
      AWBNo: awb,
      Type: "A",
      RequiredUrl: "yes"
    };

    const res = await fetch("https://eship.pacificexp.net/api/v1/Tracking/Tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqObj)
    });

    const json = await res.json();

    if (!json?.Response || json.Response.ErrorDisc !== "Success") {
      return { success: false, error: "PacificExp AWB not found" };
    }

    return {
      success: true,
      provider: "PacificExp",
      awb: awb,
      details: json.Response.Tracking[0] || {},
      history: json.Response.Events || []
    };

  } catch (err) {
    console.error("PacificExp API Error:", err);
    return { success: false, error: "Error fetching PacificExp data" };
  }
}
