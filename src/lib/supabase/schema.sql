-- Supabase Schema for Moving Company Booking Widget Creator

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Widget configurations table
CREATE TABLE widgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  logo TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  secondary_color VARCHAR(7) DEFAULT '#1E40AF',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#1F2937',
  font_family VARCHAR(100) DEFAULT 'Inter',
  button_text VARCHAR(100) DEFAULT 'Get Quote',
  success_message TEXT DEFAULT 'Thank you! We will contact you shortly.',
  custom_fields JSONB DEFAULT '[]',
  enable_insurance BOOLEAN DEFAULT true,
  enable_special_items BOOLEAN DEFAULT true,
  enable_inventory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',

  -- Contact Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,

  -- Moving Details
  move_date DATE NOT NULL,
  move_time TIME,
  flexible_dates BOOLEAN DEFAULT false,

  -- Pickup Address
  pickup_street VARCHAR(255) NOT NULL,
  pickup_unit VARCHAR(50),
  pickup_city VARCHAR(100) NOT NULL,
  pickup_state VARCHAR(100) NOT NULL,
  pickup_zip VARCHAR(20) NOT NULL,
  pickup_country VARCHAR(100) DEFAULT 'USA',
  pickup_property_type VARCHAR(50),
  pickup_floor INTEGER,
  pickup_elevator BOOLEAN DEFAULT false,

  -- Dropoff Address
  dropoff_street VARCHAR(255) NOT NULL,
  dropoff_unit VARCHAR(50),
  dropoff_city VARCHAR(100) NOT NULL,
  dropoff_state VARCHAR(100) NOT NULL,
  dropoff_zip VARCHAR(20) NOT NULL,
  dropoff_country VARCHAR(100) DEFAULT 'USA',
  dropoff_property_type VARCHAR(50),
  dropoff_floor INTEGER,
  dropoff_elevator BOOLEAN DEFAULT false,

  -- Inventory & Size
  inventory JSONB DEFAULT '[]',
  estimated_size VARCHAR(50),

  -- Special Items
  special_items JSONB DEFAULT '[]',

  -- Additional Services
  packing_service BOOLEAN DEFAULT false,
  unpacking_service BOOLEAN DEFAULT false,
  storage_needed BOOLEAN DEFAULT false,
  storage_duration VARCHAR(100),

  -- Insurance
  insurance_option VARCHAR(20),
  declared_value DECIMAL(12, 2),

  -- Custom Fields
  custom_field_values JSONB DEFAULT '{}',

  -- Notes
  additional_notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_widgets_user_id ON widgets(user_id);
CREATE INDEX idx_bookings_widget_id ON bookings(widget_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_move_date ON bookings(move_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Widgets policies
CREATE POLICY "Users can view their own widgets"
  ON widgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own widgets"
  ON widgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets"
  ON widgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widgets"
  ON widgets FOR DELETE
  USING (auth.uid() = user_id);

-- Public access for widget display (for embedded widgets)
CREATE POLICY "Public can view widgets by ID"
  ON widgets FOR SELECT
  USING (true);

-- Bookings policies
CREATE POLICY "Users can view bookings for their widgets"
  ON bookings FOR SELECT
  USING (
    widget_id IN (SELECT id FROM widgets WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update bookings for their widgets"
  ON bookings FOR UPDATE
  USING (
    widget_id IN (SELECT id FROM widgets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete bookings for their widgets"
  ON bookings FOR DELETE
  USING (
    widget_id IN (SELECT id FROM widgets WHERE user_id = auth.uid())
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_widgets_updated_at
  BEFORE UPDATE ON widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
