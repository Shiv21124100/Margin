const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const assets = [
  {
    symbol: "BTC",
    mark_price: 62000,
    contract_value: 0.001,
    allowed_leverage: [5, 10, 20, 50, 100],
  },
  {
    symbol: "ETH",
    mark_price: 3200,
    contract_value: 0.01,
    allowed_leverage: [5, 10, 25, 50],
  },
];

app.get("/config/assets", (req, res) => {
  res.json({ assets });
});

app.post("/margin/validate", (req, res) => {
  const { asset, order_size, side, leverage, margin_client } = req.body || {};

  const found = assets.find((a) => a.symbol === asset);
  if (!found) {
    return res.status(400).json({ status: "error", message: "Asset not found", margin_required: 0 });
  }

  if (!found.allowed_leverage.includes(Number(leverage))) {
    return res.status(400).json({ status: "error", message: "Invalid leverage", margin_required: 0 });
  }

  const raw =
    (Number(found.mark_price) * Number(order_size) * Number(found.contract_value)) /
    Number(leverage);
  const margin_required = Math.round(raw * 100) / 100;

  if (Number(margin_client) < margin_required) {
    return res.status(400).json({
      status: "error",
      message: "Insufficient margin submitted",
      margin_required,
    });
  }

  return res.json({ status: "ok", margin_required });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server starting on port ${PORT}...`);
});
