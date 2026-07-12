-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan          text NOT NULL,
  -- 'premium' | 'vip' | 'master'
  status        text NOT NULL DEFAULT 'active',
  -- 'active' | 'expired' | 'cancelled'
  started_at    timestamp with time zone DEFAULT now(),
  expires_at    timestamp with time zone NOT NULL,
  invoice_id    text,
  -- ref đến paymentInvoices.json
  created_at    timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_user_id_key UNIQUE (user_id)
  -- 1 user chỉ có 1 subscription active
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Index để query nhanh
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
