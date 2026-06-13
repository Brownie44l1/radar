CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  first_seen TIMESTAMP DEFAULT now(),
  last_active TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id),
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  token_chain TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  direction TEXT CHECK (direction IN ('above','below')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  fired_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS smart_money_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  label TEXT,
  chain TEXT DEFAULT 'solana',
  verified BOOLEAN DEFAULT false,
  added_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by BIGINT REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  chain TEXT DEFAULT 'solana',
  reason TEXT,
  submitted_at TIMESTAMP DEFAULT now(),
  reviewed BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_money_addr ON smart_money_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_submissions_pending ON wallet_submissions(reviewed) WHERE reviewed = false;
