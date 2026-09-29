#pragma once
#if defined(ARDUINO) || defined(ESP32)
  #include_next <mbedtls/sha256.h>
#else
  #include <cstdint>
  #include <cstring>
  typedef struct {
    uint32_t total[2];
    uint32_t state[8];
    unsigned char buffer[64];
  } mbedtls_sha256_context;
  inline void mbedtls_sha256_init(mbedtls_sha256_context*) {}
  inline void mbedtls_sha256_starts(mbedtls_sha256_context*, int) {}
  inline void mbedtls_sha256_update(mbedtls_sha256_context*, const unsigned char*, size_t) {}
  inline void mbedtls_sha256_finish(mbedtls_sha256_context*, unsigned char*) {}
  inline void mbedtls_sha256_free(mbedtls_sha256_context*) {}
#endif
