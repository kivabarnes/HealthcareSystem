;; Healthcare Data Management System
;; Manages patient consent, data access, and incentives for data sharing

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u100))
(define-constant err-already-registered (err u101))
(define-constant err-not-registered (err u102))
(define-constant err-invalid-consent (err u103))

;; Data Maps
(define-map patients
    principal
    {
        registered: bool,
        data-hash: (optional (buff 32)),
        encryption-key: (optional (buff 32))
    }
)

(define-map provider-registry
    principal
    {
        name: (string-ascii 50),
        verified: bool,
        rating: uint
    }
)

(define-map consent-records
    {patient: principal, provider: principal}
    {
        granted: bool,
        timestamp: uint,
        expiration: uint,
        access-type: (string-ascii 20)  ;; "full", "partial", "emergency"
    }
)

(define-map data-access-logs
    uint
    {
        patient: principal,
        provider: principal,
        timestamp: uint,
        data-type: (string-ascii 20)
    }
)

;; Data Variables
(define-data-var log-index uint u0)
(define-data-var token-reward uint u100)  ;; Base reward for sharing data

;; Patient Registration
(define-public (register-patient (encryption-key (buff 32)))
    (let ((sender tx-sender))
        (asserts! (is-none (get registered (map-get? patients sender))) err-already-registered)
        (ok (map-set patients
            sender
            {
                registered: true,
                data-hash: none,
                encryption-key: (some encryption-key)
            }
        ))
    )
)

