;; Attrition Management Contract
;; Handles unused room penalties

;; Map to store room blocks (simplified version from room-block contract)
(define-map room-blocks uint
  {
    property-owner: principal,
    event-name: (string-utf8 100),
    start-date: uint,
    end-date: uint,
    total-rooms: uint,
    price-per-room: uint,
    rooms-booked: uint,
    active: bool
  }
)

(define-map attrition-policies uint
  {
    block-id: uint,
    min-pickup-percentage: uint,  ;; Minimum percentage of rooms that must be booked
    penalty-percentage: uint,     ;; Percentage of room rate charged as penalty
    grace-period: uint,           ;; Days before event start when penalties begin
    calculated: bool,             ;; Whether attrition has been calculated
    penalty-amount: uint          ;; Total penalty amount
  }
)

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_BLOCK_NOT_FOUND u2)
(define-constant ERR_POLICY_EXISTS u3)
(define-constant ERR_POLICY_NOT_FOUND u4)
(define-constant ERR_INVALID_PERCENTAGE u5)
(define-constant ERR_TOO_EARLY u6)
(define-constant ERR_ALREADY_CALCULATED u7)

;; For testing - add a room block
(define-public (add-room-block
    (block-id uint)
    (property-owner principal)
    (event-name (string-utf8 100))
    (start-date uint)
    (end-date uint)
    (total-rooms uint)
    (price-per-room uint)
    (rooms-booked uint)
    (active bool))
  (ok (map-set room-blocks block-id
    {
      property-owner: property-owner,
      event-name: event-name,
      start-date: start-date,
      end-date: end-date,
      total-rooms: total-rooms,
      price-per-room: price-per-room,
      rooms-booked: rooms-booked,
      active: active
    }
  ))
)

;; Create attrition policy for a room block
(define-public (create-attrition-policy
    (block-id uint)
    (min-pickup-percentage uint)
    (penalty-percentage uint)
    (grace-period uint))
  (let ((block (map-get? room-blocks block-id)))

    ;; Check if block exists
    (asserts! (is-some block) (err ERR_BLOCK_NOT_FOUND))

    ;; Check if caller is property owner
    (asserts! (is-eq (get property-owner (unwrap-panic block)) tx-sender) (err ERR_UNAUTHORIZED))

    ;; Check if policy already exists
    (asserts! (is-none (map-get? attrition-policies block-id)) (err ERR_POLICY_EXISTS))

    ;; Validate percentages
    (asserts! (and (<= min-pickup-percentage u100) (<= penalty-percentage u100)) (err ERR_INVALID_PERCENTAGE))

    ;; Create policy
    (map-set attrition-policies block-id
      {
        block-id: block-id,
        min-pickup-percentage: min-pickup-percentage,
        penalty-percentage: penalty-percentage,
        grace-period: grace-period,
        calculated: false,
        penalty-amount: u0
      }
    )

    (ok true)
  )
)

;; Calculate attrition penalty
(define-public (calculate-attrition (block-id uint))
  (let (
      (policy (map-get? attrition-policies block-id))
      (block (map-get? room-blocks block-id))
    )

    ;; Check if policy exists
    (asserts! (is-some policy) (err ERR_POLICY_NOT_FOUND))

    ;; Check if block exists
    (asserts! (is-some block) (err ERR_BLOCK_NOT_FOUND))

    ;; Check if caller is property owner
    (asserts! (is-eq (get property-owner (unwrap-panic block)) tx-sender) (err ERR_UNAUTHORIZED))

    ;; Check if already calculated
    (asserts! (not (get calculated (unwrap-panic policy))) (err ERR_ALREADY_CALCULATED))

    ;; Check if we're past the grace period
    (asserts! (>= block-height (- (get start-date (unwrap-panic block)) (get grace-period (unwrap-panic policy))))
             (err ERR_TOO_EARLY))

    ;; Calculate actual pickup percentage
    (let (
        (total-rooms (get total-rooms (unwrap-panic block)))
        (rooms-booked (get rooms-booked (unwrap-panic block)))
        (min-required-rooms (/ (* total-rooms (get min-pickup-percentage (unwrap-panic policy))) u100))
        (price-per-room (get price-per-room (unwrap-panic block)))
      )

      ;; Calculate penalty if pickup is below minimum
      (if (< rooms-booked min-required-rooms)
        (let (
            (shortfall (- min-required-rooms rooms-booked))
            (penalty-rate (/ (* price-per-room (get penalty-percentage (unwrap-panic policy))) u100))
            (penalty-amount (* shortfall penalty-rate))
          )

          ;; Update policy with calculated penalty
          (map-set attrition-policies block-id
            (merge (unwrap-panic policy)
              {
                calculated: true,
                penalty-amount: penalty-amount
              }
            )
          )

          (ok penalty-amount)
        )

        ;; No penalty if pickup meets or exceeds minimum
        (begin
          (map-set attrition-policies block-id
            (merge (unwrap-panic policy)
              {
                calculated: true,
                penalty-amount: u0
              }
            )
          )

          (ok u0)
        )
      )
    )
  )
)

;; Get attrition policy details
(define-read-only (get-attrition-policy (block-id uint))
  (map-get? attrition-policies block-id)
)

;; Update attrition policy (before calculation)
(define-public (update-attrition-policy
    (block-id uint)
    (min-pickup-percentage uint)
    (penalty-percentage uint)
    (grace-period uint))
  (let (
      (policy (map-get? attrition-policies block-id))
      (block (map-get? room-blocks block-id))
    )

    ;; Check if policy exists
    (asserts! (is-some policy) (err ERR_POLICY_NOT_FOUND))

    ;; Check if block exists
    (asserts! (is-some block) (err ERR_BLOCK_NOT_FOUND))

    ;; Check if caller is property owner
    (asserts! (is-eq (get property-owner (unwrap-panic block)) tx-sender) (err ERR_UNAUTHORIZED))

    ;; Check if not already calculated
    (asserts! (not (get calculated (unwrap-panic policy))) (err ERR_ALREADY_CALCULATED))

    ;; Validate percentages
    (asserts! (and (<= min-pickup-percentage u100) (<= penalty-percentage u100)) (err ERR_INVALID_PERCENTAGE))

    ;; Update policy
    (map-set attrition-policies block-id
      (merge (unwrap-panic policy)
        {
          min-pickup-percentage: min-pickup-percentage,
          penalty-percentage: penalty-percentage,
          grace-period: grace-period
        }
      )
    )

    (ok true)
  )
)
