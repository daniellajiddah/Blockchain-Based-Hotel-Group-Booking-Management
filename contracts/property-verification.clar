;; Property Verification Contract
;; Validates legitimate accommodation providers

(define-data-var admin principal tx-sender)

;; Map to store verified properties
(define-map verified-properties principal
  {
    name: (string-utf8 100),
    location: (string-utf8 100),
    verified: bool,
    verification-date: uint
  }
)

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_ALREADY_VERIFIED u2)
(define-constant ERR_NOT_FOUND u3)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Register a new property
(define-public (register-property (name (string-utf8 100)) (location (string-utf8 100)))
  (begin
    (asserts! (not (is-some (map-get? verified-properties tx-sender))) (err ERR_ALREADY_VERIFIED))
    (ok (map-set verified-properties tx-sender
      {
        name: name,
        location: location,
        verified: false,
        verification-date: u0
      }
    ))
  )
)

;; Verify a property (admin only)
(define-public (verify-property (property-owner principal))
  (let ((property (map-get? verified-properties property-owner)))
    (asserts! (is-admin) (err ERR_UNAUTHORIZED))
    (asserts! (is-some property) (err ERR_NOT_FOUND))
    (ok (map-set verified-properties property-owner
      (merge (unwrap-panic property)
        {
          verified: true,
          verification-date: block-height
        }
      )
    ))
  )
)

;; Check if a property is verified
(define-read-only (is-property-verified (property-owner principal))
  (default-to false
    (get verified (map-get? verified-properties property-owner))
  )
)

;; Get property details
(define-read-only (get-property-details (property-owner principal))
  (map-get? verified-properties property-owner)
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR_UNAUTHORIZED))
    (var-set admin new-admin)
    (ok true)
  )
)
