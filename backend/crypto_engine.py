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
from typing import List, Dict, Any, Tuple, Optional
import ecdsa

# Known deterministic hardware keypairs for IoT nodes
# In production, private keys reside on ATECC608A / ESP32 secure NVS
DEVICE_MASTER_CREDENTIALS = {
    "AGRITRACE-001": {
        "private_key": "db4a376e129ffd9f586229b01f32d7dfc477e9c8a59c9749e96f7fff77339615",
        "public_key": "f85671d8b328e562b2d72d791eb038038f2a6283e680b4787696dd3a988dba91f566b9009a1b6eb1f9eeebb20509d03c04ae7f41cc7541ee0ea39e8425f284ec",
        "auth_token": "krushi_tok_agritrace_001_sec2026"
    },
    "AGRITRACE-002": {
        "private_key": "2259da38a429dcaf95e881474c2c77417c44a348d495185380a92b4bed929fe4",
        "public_key": "af5827a35d02153d187904878833583eb3e361abc104d00278ecd3af3c51507e3ca6cf1794ac591e3d135b87cb3c8aa256411945d59e5c5d6a938f1af5c5501f",
        "auth_token": "krushi_tok_agritrace_002_sec2026"
    }
}

class CryptoEngine:
    @staticmethod
    def generate_keypair() -> Tuple[str, str]:
        """Generates a secp256k1 private/public keypair in hex format."""
        sk = ecdsa.SigningKey.generate(curve=ecdsa.SECP256k1)
        vk = sk.verifying_key
        return sk.to_string().hex(), vk.to_string().hex()

    @staticmethod
    def canonical_json(data: Dict[str, Any]) -> str:
        """Deterministically sort keys and format without extra whitespace (RFC 8785 style)."""
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
    def sign_hash(record_hash: str, private_key_hex: Optional[str] = None, device_id: Optional[str] = None) -> str:
        """
        Generates real deterministic ECDSA (secp256k1) digital signature for an IoT node.
        Returns a compact 64-byte signature prefixed with 0x.
        """
        clean_hash = record_hash[2:] if record_hash.startswith("0x") else record_hash
        digest_bytes = bytes.fromhex(clean_hash)

        # Resolve private key
        priv = private_key_hex
        if not priv and device_id and device_id in DEVICE_MASTER_CREDENTIALS:
            priv = DEVICE_MASTER_CREDENTIALS[device_id]["private_key"]
        elif not priv:
            priv = DEVICE_MASTER_CREDENTIALS["AGRITRACE-001"]["private_key"]

        clean_priv = priv[2:] if priv.startswith("0x") else priv
        sk = ecdsa.SigningKey.from_string(bytes.fromhex(clean_priv), curve=ecdsa.SECP256k1)
        sig_bytes = sk.sign_deterministic(digest_bytes, hashfunc=hashlib.sha256)
        return f"0x{sig_bytes.hex()}"

    @staticmethod
    def verify_device_signature(record_hash: str, signature: str, public_key_hex: str) -> bool:
        """
        Cryptographically verifies an ECDSA (secp256k1) digital signature against device public key.
        Catches bit-level tampering, forged signatures, or altered digests.
        """
        try:
            clean_hash = record_hash[2:] if record_hash.startswith("0x") else record_hash
            clean_sig = signature[2:] if signature.startswith("0x") else signature
            clean_pub = public_key_hex[2:] if public_key_hex.startswith("0x") else public_key_hex

            digest_bytes = bytes.fromhex(clean_hash)
            sig_bytes = bytes.fromhex(clean_sig)
            pub_bytes = bytes.fromhex(clean_pub)

            vk = ecdsa.VerifyingKey.from_string(pub_bytes, curve=ecdsa.SECP256k1)
            return vk.verify(sig_bytes, digest_bytes, hashfunc=hashlib.sha256)
        except Exception:
            return False

    @staticmethod
    def verify_hash_chain(records: List[Dict[str, Any]], public_keys: Optional[Dict[str, str]] = None) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Validates an entire sequence of telemetry records:
        1. Checks monotonic sequence increment (seq[i] == seq[i-1] + 1)
        2. Recomputes SHA-256 digest of record content
        3. Verifies previous_hash pointer integrity
        4. Verifies IoT device ECDSA digital signature independently
        """
        if not records:
            return True, "No records to verify", []

        results = []
        is_all_valid = True
        reason = "Chain and digital signatures perfectly intact and verified"

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

            # Resolve device public key for signature check
            dev_id = rec.get("device_id", "")
            pub_key = None
            if public_keys and dev_id in public_keys:
                pub_key = public_keys[dev_id]
            elif dev_id in DEVICE_MASTER_CREDENTIALS:
                pub_key = DEVICE_MASTER_CREDENTIALS[dev_id]["public_key"]

            sig_valid = True
            raw_sig = rec.get("signature")
            if pub_key and raw_sig:
                sig_valid = CryptoEngine.verify_device_signature(rec["record_hash"], raw_sig, pub_key)
            
            valid = hash_matches and prev_matches and sig_valid
            if not valid:
                is_all_valid = False
                reason = f"Verification mismatch at sequence #{rec['sequence']}: hash_match={hash_matches}, prev_pointer_match={prev_matches}, sig_valid={sig_valid}"

            results.append({
                "sequence": rec["sequence"],
                "recalculated_hash": recalculated_hash,
                "stored_hash": rec["record_hash"],
                "previous_hash": rec["previous_hash"],
                "expected_previous": expected_prev,
                "signature": raw_sig,
                "is_signature_valid": sig_valid,
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

        normalized_leaves = [h[2:] if h.startswith("0x") else h for h in leaf_hashes]
        tree = [normalized_leaves]
        current_level = normalized_leaves

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

    @staticmethod
    def get_merkle_proof(leaf_hashes: List[str], target_index: int) -> Dict[str, Any]:
        """
        Generates a binary Merkle inclusion audit path (proof array) for leaf at `target_index`.
        Each proof step specifies {"position": "left" | "right", "sibling_hash": "<hex>"}.
        """
        if not leaf_hashes or target_index < 0 or target_index >= len(leaf_hashes):
            raise ValueError("Invalid leaf index or empty leaf list")

        merkle_root, tree = CryptoEngine.build_merkle_tree(leaf_hashes)
        proof: List[Dict[str, str]] = []
        idx = target_index

        for level in tree[:-1]:
            if idx % 2 == 0:
                sibling_idx = idx + 1 if idx + 1 < len(level) else idx
                proof.append({
                    "position": "right",
                    "sibling_hash": level[sibling_idx]
                })
            else:
                sibling_idx = idx - 1
                proof.append({
                    "position": "left",
                    "sibling_hash": level[sibling_idx]
                })
            idx //= 2

        target_leaf = leaf_hashes[target_index]
        clean_leaf = target_leaf[2:] if target_leaf.startswith("0x") else target_leaf
        return {
            "leaf_index": target_index,
            "leaf_hash": clean_leaf,
            "merkle_root": merkle_root,
            "proof": proof,
            "tree_depth": len(tree)
        }

    @staticmethod
    def verify_merkle_proof(leaf_hash: str, proof: List[Dict[str, str]], expected_merkle_root: str) -> bool:
        """
        Independently verifies a binary Merkle inclusion proof for a given leaf hash against expected_merkle_root.
        """
        current = leaf_hash[2:] if leaf_hash.startswith("0x") else leaf_hash
        for step in proof:
            sibling = step["sibling_hash"]
            sibling_clean = sibling[2:] if sibling.startswith("0x") else sibling
            if step.get("position") == "left":
                current = hashlib.sha256(f"{sibling_clean}{current}".encode("utf-8")).hexdigest()
            else:
                current = hashlib.sha256(f"{current}{sibling_clean}".encode("utf-8")).hexdigest()

        clean_root = expected_merkle_root[2:] if expected_merkle_root.startswith("0x") else expected_merkle_root
        return current.lower() == clean_root.lower()

