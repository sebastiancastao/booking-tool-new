-- Promo codes (idempotent migration)

-- Enable UUID extension (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT promo_codes_discount_value_check CHECK (
    (discount_type = 'percent' AND discount_value BETWEEN 1 AND 100)
    OR
    (discount_type = 'fixed' AND discount_value >= 1)
  ),
  CONSTRAINT promo_codes_max_uses_check CHECK (max_uses IS NULL OR max_uses >= 1),
  CONSTRAINT promo_codes_uses_count_check CHECK (uses_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, starts_at, ends_at);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Anyone can view promo codes"
    ON promo_codes FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Anyone can create promo codes"
    ON promo_codes FOR INSERT
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Anyone can update promo codes"
    ON promo_codes FOR UPDATE
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Anyone can delete promo codes"
    ON promo_codes FOR DELETE
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- updated_at trigger (safe if re-run)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

