# Hyperledger Fabric — AgriTrace Enterprise Consortium Topology

## 1. Overview
The **KRUSHI / AgriTrace** platform uses **Hyperledger Fabric v2.5** as its decentralized enterprise ledger instead of public cryptocurrencies like Polygon or Ethereum. 

### Why Hyperledger Fabric?
1. **100% Free & Open Source**: Hosted by the Linux Foundation. Zero gas fees, zero cryptocurrency volatility, and zero financial overhead for farmers and co-operatives.
2. **Permissioned Consortium Trust**: Built specifically for agricultural supply chains where participants are authenticated enterprise and government organizations:
   - **FarmerCoopMSP**: Smallholder farmer co-operatives (origin harvest registration).
   - **LogisticsMSP**: Cold-chain reefer transport providers (telemetry & transit checkpoints).
   - **ApedaGovMSP**: Agricultural & Processed Food Products Export Development Authority (quality & GI-tag compliance audit).
   - **RetailBuyerMSP**: APMC Mandis, food processors, and wholesale terminal markets.
3. **Private Channels (`agrichannel`)**: Multi-party transactions and batch Merkle roots are committed to the channel ledger without leaking proprietary pricing or farmer PII to unauthorized third parties.
4. **Crash Fault Tolerant (CFT) / BFT Consensus**: Raft-based distributed orderer service (`orderer.krushi.net:7050`) ensuring sub-second finality.

---

## 2. Chaincode Specification (`agritrace_cc`)
- **Source Code**: [`agritrace_anchor.go`](./chaincode/agritrace_anchor.go)
- **Language**: Go (`github.com/hyperledger/fabric-contract-api-go`)
- **Channel**: `agrichannel`
- **Endorsement Policy**: `AND('ApedaGovMSP.peer', OR('FarmerCoopMSP.peer', 'LogisticsMSP.peer'))`

### Core Functions:
1. `AnchorBatch(shipmentId, batchCode, merkleRoot, startSeq, endSeq, recordsCount)`: Commits immutable 32-byte batch Merkle roots with monotonic sequence boundaries and endorsements.
2. `VerifyMerkleRoot(merkleRoot)`: Queries world state (CouchDB / LevelDB) to confirm whether a batch root was endorsed and anchored.
3. `GetShipmentHistory(shipmentId)`: Returns the provenance trail of all anchored batches for a specific shipment.
