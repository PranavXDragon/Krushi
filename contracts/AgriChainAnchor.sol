// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgriChainAnchor
 * @notice SIH26232 KRUSHI Cold-Chain Merkle Root Anchoring Smart Contract
 * @dev Deployed on Polygon PoS Amoy Testnet (Chain ID: 80002)
 *      Stores immutable batch Merkle roots, sequence bounds, and timestamps
 *      for offline-first farm-to-fork agricultural cold-chain traceability.
 */
contract AgriChainAnchor {
    struct BatchAnchor {
        string shipmentId;
        string batchCode;
        bytes32 merkleRoot;
        uint256 startSequence;
        uint256 endSequence;
        uint256 recordsCount;
        uint256 anchoredAt;
        address submitter;
        bool exists;
    }

    address public owner;
    mapping(bytes32 => BatchAnchor) public anchorsByRoot;
    mapping(string => bytes32[]) public shipmentRoots;
    bytes32[] public allMerkleRoots;

    event BatchAnchored(
        string indexed shipmentId,
        string batchCode,
        bytes32 indexed merkleRoot,
        uint256 startSequence,
        uint256 endSequence,
        uint256 recordsCount,
        uint256 timestamp,
        address indexed submitter
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "AgriChainAnchor: caller is not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Anchors a new telemetry batch Merkle root onto Polygon PoS Amoy.
     */
    function anchorBatch(
        string calldata shipmentId,
        string calldata batchCode,
        bytes32 merkleRoot,
        uint256 startSequence,
        uint256 endSequence,
        uint256 recordsCount
    ) external returns (bool) {
        require(merkleRoot != bytes32(0), "AgriChainAnchor: empty merkle root");
        require(!anchorsByRoot[merkleRoot].exists, "AgriChainAnchor: root already anchored");
        require(endSequence >= startSequence, "AgriChainAnchor: invalid sequence range");

        BatchAnchor memory newAnchor = BatchAnchor({
            shipmentId: shipmentId,
            batchCode: batchCode,
            merkleRoot: merkleRoot,
            startSequence: startSequence,
            endSequence: endSequence,
            recordsCount: recordsCount,
            anchoredAt: block.timestamp,
            submitter: msg.sender,
            exists: true
        });

        anchorsByRoot[merkleRoot] = newAnchor;
        shipmentRoots[shipmentId].push(merkleRoot);
        allMerkleRoots.push(merkleRoot);

        emit BatchAnchored(
            shipmentId,
            batchCode,
            merkleRoot,
            startSequence,
            endSequence,
            recordsCount,
            block.timestamp,
            msg.sender
        );

        return true;
    }

    /**
     * @notice Verifies whether a Merkle root has been anchored on-chain.
     */
    function verifyRoot(bytes32 merkleRoot)
        external
        view
        returns (
            bool isAnchored,
            string memory shipmentId,
            string memory batchCode,
            uint256 startSequence,
            uint256 endSequence,
            uint256 recordsCount,
            uint256 anchoredAt,
            address submitter
        )
    {
        BatchAnchor memory a = anchorsByRoot[merkleRoot];
        return (
            a.exists,
            a.shipmentId,
            a.batchCode,
            a.startSequence,
            a.endSequence,
            a.recordsCount,
            a.anchoredAt,
            a.submitter
        );
    }

    /**
     * @notice Returns total count of anchored batches.
     */
    function totalAnchoredBatches() external view returns (uint256) {
        return allMerkleRoots.length;
    }
}
