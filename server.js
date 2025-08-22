import express from 'express';
import cors from 'cors';
import { getAirwingsTracking, getPacificExpTracking } from './index.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root check
app.get('/', (req, res) => {
  res.send('Tracking API is running');
});

// Airwings Endpoint
app.get('/track/airwings/:awb', async (req, res) => {
  const { awb } = req.params;
  const result = await getAirwingsTracking(awb);
  res.json(result);
});

// PacificEXP Endpoint
app.get('/track/pacificexp/:awb', async (req, res) => {
  const { awb } = req.params;
  const result = await getPacificExpTracking(awb);
  res.json(result);
});

// Start Server (Render compatible)
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
