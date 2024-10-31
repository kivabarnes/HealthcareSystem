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

;; Provider Registration
(define-public (register-provider (name (string-ascii 50)))
    (let ((sender tx-sender))
        (ok (map-set provider-registry
            sender
            {
                name: name,
                verified: false,
                rating: u0
            }
        ))
    )
)

;; Consent Management
(define-public (grant-consent (provider principal) (access-type (string-ascii 20)) (duration uint))
    (let (
        (sender tx-sender)
        (expiration (+ block-height duration))
    )
        (asserts! (is-some (map-get? patients sender)) err-not-registered)
        (asserts! (is-some (map-get? provider-registry provider)) err-not-registered)

        (ok (map-set consent-records
            {patient: sender, provider: provider}
            {
                granted: true,
                timestamp: block-height,
                expiration: expiration,
                access-type: access-type
            }
        ))
    )
)

(define-public (revoke-consent (provider principal))
    (let ((sender tx-sender))
        (asserts! (is-some (map-get? patients sender)) err-not-registered)
        (ok (map-set consent-records
            {patient: sender, provider: provider}
            {
                granted: false,
                timestamp: block-height,
                expiration: u0,
                access-type: "none"
            }
        ))
    )
)

;; Data Access Control
(define-public (request-data-access (patient principal) (data-type (string-ascii 20)))
    (let (
        (sender tx-sender)
        (consent-status (unwrap! (map-get? consent-records {patient: patient, provider: sender}) err-unauthorized))
    )
        (asserts! (get granted consent-status) err-unauthorized)
        (asserts! (< block-height (get expiration consent-status)) err-invalid-consent)

        ;; Log the access
        (map-set data-access-logs
            (var-get log-index)
            {
                patient: patient,
                provider: sender,
                timestamp: block-height,
                data-type: data-type
            }
        )
        (var-set log-index (+ (var-get log-index) u1))

        ;; Return encryption key if authorized
        (ok (get encryption-key (unwrap! (map-get? patients patient) err-not-registered)))
    )
)

;; Token Rewards
(define-public (claim-sharing-reward (provider principal))
    (let (
        (sender tx-sender)
        (reward-amount (var-get token-reward))
    )
        (asserts! (is-some (map-get? patients sender)) err-not-registered)
        ;; Implementation would include token transfer logic
        (ok reward-amount)
    )
)
