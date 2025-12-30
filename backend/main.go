package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type AssetConfig struct {
	Symbol          string    `json:"symbol"`
	MarkPrice       float64   `json:"mark_price"`
	ContractValue   float64   `json:"contract_value"`
	AllowedLeverage []float64 `json:"allowed_leverage"`
}

type ConfigResponse struct {
	Assets []AssetConfig `json:"assets"`
}

type MarginRequest struct {
	Asset        string  `json:"asset"`
	OrderSize    float64 `json:"order_size"`
	Side         string  `json:"side"`
	Leverage     float64 `json:"leverage"`
	MarginClient float64 `json:"margin_client"`
}

type MarginResponse struct {
	Status         string  `json:"status"`
	MarginRequired float64 `json:"margin_required"`
}

type ErrorResponse struct {
	Status         string  `json:"status"`
	Message        string  `json:"message"`
	MarginRequired float64 `json:"margin_required"`
}

var assets = []AssetConfig{
	{
		Symbol:          "BTC",
		MarkPrice:       62000,
		ContractValue:   0.001,
		AllowedLeverage: []float64{5, 10, 20, 50, 100},
	},
	{
		Symbol:          "ETH",
		MarkPrice:       3200,
		ContractValue:   0.01,
		AllowedLeverage: []float64{5, 10, 25, 50},
	},
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

func configHandler(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	w.Header().Set("Content-Type", "application/json")
	response := ConfigResponse{Assets: assets}
	json.NewEncoder(w).Encode(response)
}

func validateHandler(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req MarginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var selectedAsset *AssetConfig
	for _, a := range assets {
		if a.Symbol == req.Asset {
			selectedAsset = &a
			break
		}
	}

	if selectedAsset == nil {
		http.Error(w, "Asset not found", http.StatusBadRequest)
		return
	}

	validLeverage := false
	for _, l := range selectedAsset.AllowedLeverage {
		if l == req.Leverage {
			validLeverage = true
			break
		}
	}
	if !validLeverage {
		http.Error(w, "Invalid leverage", http.StatusBadRequest)
		return
	}

	marginRequired := (selectedAsset.MarkPrice * req.OrderSize * selectedAsset.ContractValue) / req.Leverage

	marginRequired = float64(int(marginRequired*100+0.5)) / 100.0

	w.Header().Set("Content-Type", "application/json")

	if req.MarginClient < marginRequired {
		resp := ErrorResponse{
			Status:         "error",
			Message:        "Insufficient margin submitted",
			MarginRequired: marginRequired,
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(resp)
	} else {
		resp := MarginResponse{
			Status:         "ok",
			MarginRequired: marginRequired,
		}
		json.NewEncoder(w).Encode(resp)
	}
}

func main() {
	http.HandleFunc("/config/assets", configHandler)
	http.HandleFunc("/margin/validate", validateHandler)

	fmt.Println("Server starting on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
