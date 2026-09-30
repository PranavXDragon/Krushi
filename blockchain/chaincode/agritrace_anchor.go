package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// AgriTraceContract provides functions for anchoring and verifying cold-chain Merkle roots
type AgriTraceContract struct {
	contractapi.Contract
}

// BatchAnchor represents an immutable supply-chain Merkle root anchor in Hyperledger Fabric state
type BatchAnchor struct {
	ShipmentID      string `json:"shipment_id"`
	BatchCode       string `json:"batch_code"`
	MerkleRoot      string `json:"merkle_root"`
	StartSequence   int    `json:"start_sequence"`
	EndSequence     int    `json:"end_sequence"`
	RecordsCount    int    `json:"records_count"`
	AnchoredAt      string `json:"anchored_at"`
	SubmitterMSP    string `json:"submitter_msp"`
	EndorsingPeers  string `json:"endorsing_peers"`
	TxID            string `json:"tx_id"`
	VerificationStatus string `json:"verification_status"`
}

// InitLedger adds initial test state or initializes the chaincode
func (c *AgriTraceContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	fmt.Println("AgriTrace Hyperledger Fabric Chaincode Initialized on Channel: agrichannel")
	return nil
}

// AnchorBatch records a new telemetry batch Merkle root on the ledger
func (c *AgriTraceContract) AnchorBatch(
	ctx contractapi.TransactionContextInterface,
	shipmentID string,
	batchCode string,
	merkleRoot string,
	startSequence int,
	endSequence int,
	recordsCount int,
) (*BatchAnchor, error) {
	if len(merkleRoot) == 0 {
		return nil, fmt.Errorf("merkle root cannot be empty")
	}

	// Check if already anchored to guarantee idempotency and immutability
	existingBytes, err := ctx.GetStub().GetState(merkleRoot)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if existingBytes != nil {
		return nil, fmt.Errorf("merkle root %s already anchored on agrichannel", merkleRoot)
	}

	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		clientMSPID = "ApedaGovMSP"
	}

	txID := ctx.GetStub().GetTxID()
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	anchorTime := time.Now().UTC().Format(time.RFC3339)
	if err == nil && txTimestamp != nil {
		anchorTime = time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC().Format(time.RFC3339)
	}

	anchor := BatchAnchor{
		ShipmentID:         shipmentID,
		BatchCode:          batchCode,
		MerkleRoot:         merkleRoot,
		StartSequence:      startSequence,
		EndSequence:        endSequence,
		RecordsCount:       recordsCount,
		AnchoredAt:         anchorTime,
		SubmitterMSP:       clientMSPID,
		EndorsingPeers:     "peer0.apeda-gov.krushi.net, peer0.farmer-coop.krushi.net, peer0.logistics.krushi.net",
		TxID:               txID,
		VerificationStatus: "ANCHORED_VALID",
	}

	anchorJSON, err := json.Marshal(anchor)
	if err != nil {
		return nil, err
	}

	// Save to state with composite key and direct root key
	err = ctx.GetStub().PutState(merkleRoot, anchorJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to put state: %v", err)
	}

	// Create composite key for shipment indexing: shipment~root
	shipmentIndexKey, err := ctx.GetStub().CreateCompositeKey("shipment~root", []string{shipmentID, merkleRoot})
	if err == nil {
		_ = ctx.GetStub().PutState(shipmentIndexKey, []byte{0x00})
	}

	// Emit chaincode event
	_ = ctx.GetStub().SetEvent("BatchAnchoredEvent", anchorJSON)

	return &anchor, nil
}

// VerifyMerkleRoot checks if a Merkle root exists on the immutable ledger
func (c *AgriTraceContract) VerifyMerkleRoot(
	ctx contractapi.TransactionContextInterface,
	merkleRoot string,
) (*BatchAnchor, error) {
	anchorBytes, err := ctx.GetStub().GetState(merkleRoot)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if anchorBytes == nil {
		return nil, fmt.Errorf("merkle root %s not found on agrichannel", merkleRoot)
	}

	var anchor BatchAnchor
	err = json.Unmarshal(anchorBytes, &anchor)
	if err != nil {
		return nil, err
	}

	return &anchor, nil
}

func main() {
	cc, err := contractapi.NewChaincode(&AgriTraceContract{})
	if err != nil {
		fmt.Printf("Error creating AgriTrace chaincode: %s", err.Error())
		return
	}

	if err := cc.Start(); err != nil {
		fmt.Printf("Error starting AgriTrace chaincode: %s", err.Error())
	}
}
