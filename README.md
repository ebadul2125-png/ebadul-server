# Tracking Backend (Airwings + PacificExp)

Express backend with two endpoints:

- `GET /track/airwings/:awb`
- `GET /track/pacificexp/:awb`

## Local Run

```bash
npm install
node index.js
```

Then open:

- http://localhost:5000/track/airwings/21568006
- http://localhost:5000/track/pacificexp/8880563860

## Deploy (Render)

- Create a **Web Service**
- Build command: `npm install`
- Start command: `node index.js`
- Environment: Node 22
