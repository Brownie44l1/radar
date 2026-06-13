# ERD — Radar

## Entities

### User
```
id              BIGINT PRIMARY KEY    -- Telegram user ID
username        TEXT
first_name      TEXT
last_active     TIMESTAMP DEFAULT now()
first_seen      TIMESTAMP DEFAULT now()
```

### Alert
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         BIGINT REFERENCES users(id)
token_address   TEXT NOT NULL
token_symbol    TEXT
token_chain     TEXT NOT NULL         -- 'solana' | 'ethereum' | 'bsc' etc
target_price    NUMERIC NOT NULL
direction       TEXT CHECK (direction IN ('above','below')) NOT NULL
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP DEFAULT now()
fired_at        TIMESTAMP
```

### SmartMoneyWallet
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
wallet_address  TEXT UNIQUE NOT NULL
label           TEXT                  -- e.g. "Alpha Whale #1"
chain           TEXT DEFAULT 'solana'
verified        BOOLEAN DEFAULT false
added_at        TIMESTAMP DEFAULT now()
```

### WalletSubmission
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
submitted_by    BIGINT REFERENCES users(id)
wallet_address  TEXT NOT NULL
chain           TEXT DEFAULT 'solana'
reason          TEXT
submitted_at    TIMESTAMP DEFAULT now()
reviewed        BOOLEAN DEFAULT false
```

## Relationships
```
User ──< Alert               (one user, many alerts)
User ──< WalletSubmission    (one user, many submissions)
WalletSubmission >── SmartMoneyWallet  (approved submission becomes verified wallet)
```

## Indexes
```sql
CREATE INDEX idx_alerts_active   ON alerts(is_active) WHERE is_active = true;
CREATE INDEX idx_alerts_user     ON alerts(user_id);
CREATE INDEX idx_smart_money_addr ON smart_money_wallets(wallet_address);
CREATE INDEX idx_submissions_reviewed ON wallet_submissions(reviewed) WHERE reviewed = false;
```

## Notes
- Token data lives in Redis only — never persisted to Postgres
- Chat history is session-only — never persisted (privacy + cost)
- No hard deletes — alerts deactivate, submissions mark reviewed
- chain field on Alert future-proofs multi-chain alert polling
