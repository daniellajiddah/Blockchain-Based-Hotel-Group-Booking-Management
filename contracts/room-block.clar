;; Room Block Contract
;; Manages reserved inventory for events

;; Map to store verified properties (simplified version of property-verification)
(define-map verified-properties principal bool)

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

(define-data-var block-counter uint u0)

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_INVALID_DATES u2)
(define-constant ERR_BLOCK_NOT_FOUND u3)
(define-constant ERR_NOT_VERIFIED u4)

;; For testing purposes - verify a property
(define-public (verify-property (property-owner principal))
  (ok (map-set verified-properties property-owner true))
)

;; Create a new room block
(define-public (create-room-block
    (event-name (string-utf8 100))
    (start-date uint)
    (end-date uint)
    (total-rooms uint)
    (price-per-room uint))
  (let ((block-id (+ (var-get block-counter) u1))
        (property-verified (default-to false (map-get? verified-properties tx-sender))))

    ;; Check if property is verified
    (asserts! property-verified (err ERR_NOT_VERIFIED))

    ;; Validate dates
    (asserts! (> end-date start-date) (err ERR_INVALID_DATES))

    ;; Create the room block
    (map-set room-blocks block-id
      {
        property-owner: tx-sender,
        event-name: event-name,
        start-date: start-date,
        end-date: end-date,
        total-rooms: total-rooms,
        price-per-room: price-per-room,
        rooms-booked: u0,
        active: true
      }
    )

    ;; Increment counter
    (var-set block-counter block-id)

    (ok block-id)
  )
)

;; Update room block details (only by property owner)
(define-public (update-room-block
    (block-id uint)
    (event-name (string-utf8 100))
    (start-date uint)
    (end-date uint)
    (total-rooms uint)
    (price-per-room uint))
  (let ((block (map-get? room-blocks block-id)))

    ;; Check if block exists
    (asserts! (is-some block) (err ERR_BLOCK_NOT_FOUND))

    ;; Check if caller is property owner
    (asserts! (is-eq (get property-owner (unwrap-panic block)) tx-sender) (err ERR_UNAUTHORIZED))

    ;; Validate dates
    (asserts! (> end-date start-date) (err ERR_INVALID_DATES))

    ;; Update the room block
    (map-set room-blocks block-id
      (merge (unwrap-panic block)
        {
          event-name: event-name,
          start-date: start-date,
          end-date: end-date,
          total-rooms: total-rooms,
          price-per-room: price-per-room
        }
      )
    )

    (ok true)
  )
)

;; Get room block details
(define-read-only (get-room-block (block-id uint))
  (map-get? room-blocks block-id)
)

;; Deactivate a room block
(define-public (deactivate-room-block (block-id uint))
  (let ((block (map-get? room-blocks block-id)))

    ;; Check if block exists
    (asserts! (is-some block) (err ERR_BLOCK_NOT_FOUND))

    ;; Check if caller is property owner
    (asserts! (is-eq (get property-owner (unwrap-panic block)) tx-sender) (err ERR_UNAUTHORIZED))

    ;; Deactivate the room block
    (map-set room-blocks block-id
      (merge (unwrap-panic block) { active: false })
    )

    (ok true)
  )
)

;; Update rooms booked count
(define-public (update-rooms-booked (block-id uint) (rooms-count uint))
  (let ((block (map-get? room-blocks block-id)))

    ;; Check if block exists
    (asserts! (is-some block) (err ERR_BLOCK_NOT_FOUND))

    ;; Update rooms booked
    (map-set room-blocks block-id
      (merge (unwrap-panic block)
        {
          rooms-booked: (+ (get rooms-booked (unwrap-panic block)) rooms-count)
        }
      )
    )

    (ok true)
  )
)
