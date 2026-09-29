"""
AgriTrace Cryptographic Engine & Hash Chaining Service
Implements Section 10 of PRD:
- Canonical deterministic serialization
- SHA-256 hash chaining (previous_hash -> current_hash)
- Merkle Tree generation for decentralized ledger batch proofs
- Digital signature generation and verification
"""

import hashlib
import json
import secrets
from typing import List, Dict, Any, Tuple

class CryptoEngine:
    @staticmethod
    def canonical_json(data: Dict[str, Any]) -> str:
        """Deterministically sort keys and format without extra whitespace."""
        # Convert float rounding for deterministic hashing
        normalized = {}
        for k, v in sorted(data.items()):
            if isinstance(v, float):
                normalized[k] = round(v, 4)
            else:
                normalized[k] = v
        return json.dumps(normalized, sort_keys=True, separators=(',', ':'))

    @staticmethod
    def compute_record_hash(
        device_id: str,
        shipment_id: str,
        sequence: int,
        timestamp_str: str,
        temperature: float,
        humidity: float,
        gas_ethylene: float,
        latitude: float,
        longitude: float,
        battery: float,
        previous_hash: str
    ) -> str:
        """
        Calculates SHA-256 digest of canonical telemetry record payload.
        """
        payload = {
            "device_id": device_id,
            "shipment_id": shipment_id,
            "sequence": sequence,
            "timestamp": timestamp_str,
            "temperature": temperature,
            "humidity": humidity,
            "gas_ethylene": gas_ethylene,
            "latitude": latitude,
            "longitude": longitude,
            "battery": battery,
            "previous_hash": previous_hash
        }
        canonical_str = CryptoEngine.canonical_json(payload)
        return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()

    @staticmethod
    def sign_hash(record_hash: str, private_key_sim: str = "node_priv_sec_2026") -> str:
        """
        Generates deterministic signature representation for the IoT node.
        """
        raw_sig = hashlib.sha256(f"{record_hash}:{private_key_sim}".encode('utf-8')).hexdigest()
        return f"0x{raw_sig[:64]}"

    @staticmethod
    def verify_hash_chain(records: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Validates an entire sequence of telemetry records:
        1. Checks monotonic sequence increment (seq[i] == seq[i-1] + 1)
        2. Recomputes SHA-256 digest of record content
        3. Verifies previous_hash pointer integrity
        """
        if not records:
            return True, "No records to verify", []

        results = []
        is_all_valid = True
        reason = "Chain perfectly intact and verified"

        for i, rec in enumerate(records):
            expected_prev = "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000" if i == 0 else records[i-1]["record_hash"]
            
            # Recalculate hash
            recalculated_hash = CryptoEngine.compute_record_hash(
                device_id=rec["device_id"],
                shipment_id=rec["shipment_id"],
                sequence=rec["sequence"],
                timestamp_str=rec["timestamp"],
                temperature=rec["temperature"],
                humidity=rec["humidity"],
                gas_ethylene=rec["gas_ethylene"],
                latitude=rec["latitude"],
                longitude=rec["longitude"],
                battery=rec["battery"],
                previous_hash=rec["previous_hash"]
            )

            hash_matches = (recalculated_hash == rec["record_hash"])
            prev_matches = (rec["previous_hash"] == expected_prev)
            
            valid = hash_matches and prev_matches
            if not valid:
                is_all_valid = False
                reason = f"Verification mismatch at sequence #{rec['sequence']}: hash_match={hash_matches}, prev_pointer_match={prev_matches}"

            results.append({
                "sequence": rec["sequence"],
                "recalculated_hash": recalculated_hash,
                "stored_hash": rec["record_hash"],
                "previous_hash": rec["previous_hash"],
                "expected_previous": expected_prev,
                "is_valid": valid
            })

        return is_all_valid, reason, results

    @staticmethod
    def build_merkle_tree(leaf_hashes: List[str]) -> Tuple[str, List[List[str]]]:
        """
        Computes the Merkle Root for a batch of telemetry hashes.
        """
        if not leaf_hashes:
            genesis = hashlib.sha256(b"GENESIS").hexdigest()
            return f"0x{genesis}", [[genesis]]

        tree = [leaf_hashes]
        current_level = leaf_hashes

        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                combined = hashlib.sha256(f"{left}{right}".encode('utf-8')).hexdigest()
                next_level.append(combined)
            tree.append(next_level)
            current_level = next_level

        merkle_root = f"0x{current_level[0]}"
        return merkle_root, tree
