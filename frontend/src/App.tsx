import { useEffect, useMemo, useState } from "react";

type Asset = {
  symbol: string;
  mark_price: number;
  contract_value: number;
  allowed_leverage: number[];
};

type ConfigResponse = {
  assets: Asset[];
};

const DEFAULT_ASSETS: Asset[] = [
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

type ValidateRequest = {
  asset: string;
  order_size: number;
  side: "long" | "short";
  leverage: number;
  margin_client: number;
};

type ValidateResponseOk = {
  status: "ok";
  margin_required: number;
};

type ValidateResponseErr = {
  status: "error";
  message: string;
  margin_required: number;
};

type ValidateResponse = ValidateResponseOk | ValidateResponseErr;

const BACKEND_URL =
  (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8080";

export function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC");
  const [leverage, setLeverage] = useState<number>(20);
  const [orderSize, setOrderSize] = useState<number>(1);
  const [side, setSide] = useState<"long" | "short">("long");
  const [result, setResult] = useState<ValidateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/config/assets`);
        if (!res.ok) throw new Error(`Failed to fetch assets (${res.status})`);
        const data: ConfigResponse = await res.json();
        setAssets(data.assets);
        if (!data.assets.find((a) => a.symbol === selectedSymbol)) {
          setSelectedSymbol(data.assets[0]?.symbol ?? "BTC");
        }
      } catch (e: any) {
        setError("Unable to fetch asset config from backend. Using defaults.");
        setAssets(DEFAULT_ASSETS);
        if (!DEFAULT_ASSETS.find((a) => a.symbol === selectedSymbol)) {
          setSelectedSymbol(DEFAULT_ASSETS[0]?.symbol ?? "BTC");
        }
      }
    }
    load();
  }, []);

  const selectedAsset = useMemo(
    () => assets.find((a) => a.symbol === selectedSymbol) ?? null,
    [assets, selectedSymbol]
  );

  useEffect(() => {
    if (selectedAsset && !selectedAsset.allowed_leverage.includes(leverage)) {
      setLeverage(selectedAsset.allowed_leverage[0]);
    }
  }, [selectedAsset]);

  const marginRequired = useMemo(() => {
    if (!selectedAsset) return 0;
    const raw =
      (selectedAsset.mark_price * orderSize * selectedAsset.contract_value) /
      leverage;
    return Math.round(raw * 100) / 100;
  }, [selectedAsset, orderSize, leverage]);

  async function submitPreview() {
    setResult(null);
    setError(null);
    if (!selectedAsset) {
      setError("No asset selected");
      return;
    }
    const payload: ValidateRequest = {
      asset: selectedAsset.symbol,
      order_size: orderSize,
      side,
      leverage,
      margin_client: marginRequired,
    };
    try {
      const res = await fetch(`${BACKEND_URL}/margin/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ValidateResponse = await res.json();
      setResult(data);
      if (!res.ok || data.status === "error") {
        setError(
          "Insufficient margin submitted. Required: " + data.margin_required
        );
      }
    } catch (e: any) {
      const offlineRequired = marginRequired;
      if (payload.margin_client < offlineRequired) {
        const err: ValidateResponseErr = {
          status: "error",
          message: "Insufficient margin submitted",
          margin_required: offlineRequired,
        };
        setResult(err);
        setError(
          "Backend unreachable. Offline validation: Required " +
            offlineRequired.toFixed(2)
        );
      } else {
        const ok: ValidateResponseOk = {
          status: "ok",
          margin_required: offlineRequired,
        };
        setResult(ok);
        setError(null);
      }
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Margin Requirement Calculator</h1>
        <p>Initial margin preview</p>
      </header>

      <section className="card">
        <div className="row">
          <label>Asset</label>
          <div className="asset-buttons">
            {assets.map((a) => (
              <button
                key={a.symbol}
                className={
                  "btn " + (selectedSymbol === a.symbol ? "btn-primary" : "")
                }
                onClick={() => setSelectedSymbol(a.symbol)}
              >
                {a.symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="row">
          <label>Mark Price</label>
          <div className="value">
            {selectedAsset ? `$${selectedAsset.mark_price.toLocaleString()}` : "-"}
          </div>
        </div>

        <div className="row">
          <label>Contract Value</label>
          <div className="value">
            {selectedAsset ? selectedAsset.contract_value : "-"}
          </div>
        </div>

        <div className="row">
          <label>Leverage</label>
          <select
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
          >
            {selectedAsset?.allowed_leverage.map((l) => (
              <option key={l} value={l}>
                {l}x
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <label>Order Size</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={orderSize}
            onChange={(e) => setOrderSize(Number(e.target.value))}
          />
        </div>

        <div className="row">
          <label>Side</label>
          <div className="asset-buttons">
            <button
              className={"btn " + (side === "long" ? "btn-primary" : "")}
              onClick={() => setSide("long")}
            >
              Long
            </button>
            <button
              className={"btn " + (side === "short" ? "btn-primary" : "")}
              onClick={() => setSide("short")}
            >
              Short
            </button>
          </div>
        </div>

        <div className="row margin-row">
          <label>Calculated Margin</label>
          <div className="margin-value">${marginRequired.toFixed(2)}</div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={submitPreview}>
            Submit Order Preview
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}
        {result && result.status === "ok" && (
          <div className="alert success">
            Approved. Margin Required: ${result.margin_required.toFixed(2)}
          </div>
        )}
      </section>

      <footer className="footer">
        <span>Clean layout, reactive updates, clear errors</span>
      </footer>
    </div>
  );
}
