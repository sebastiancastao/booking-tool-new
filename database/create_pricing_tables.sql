-- Create pricing tables for widgets
-- Run this in your Supabase SQL Editor

-- Team pricing options (move, loaders, unloading)
CREATE TABLE IF NOT EXISTS pricing_teams (
    id BIGSERIAL PRIMARY KEY,
    widget_id BIGINT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    team_group VARCHAR(20) NOT NULL,
    team_option VARCHAR(20) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    minimum_hours DECIMAL(5, 2) NOT NULL DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id, team_group, team_option)
);

-- Labor estimate ranges by property type
CREATE TABLE IF NOT EXISTS pricing_labor_estimates (
    id BIGSERIAL PRIMARY KEY,
    widget_id BIGINT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    estimate_group VARCHAR(20) NOT NULL,
    estimate_option VARCHAR(20) NOT NULL,
    min_labor DECIMAL(5, 2) NOT NULL DEFAULT 2,
    max_labor DECIMAL(5, 2) NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id, estimate_group, estimate_option)
);

-- Travel and distance pricing
CREATE TABLE IF NOT EXISTS pricing_travel (
    id BIGSERIAL PRIMARY KEY,
    widget_id BIGINT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    travel_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.75,
    price_per_mile DECIMAL(10, 2) NOT NULL DEFAULT 2.50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id)
);

-- Protection/insurance pricing
CREATE TABLE IF NOT EXISTS pricing_protection (
    id BIGSERIAL PRIMARY KEY,
    widget_id BIGINT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    protection_charge DECIMAL(10, 2) NOT NULL DEFAULT 15.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id)
);

-- Accessibility charges
CREATE TABLE IF NOT EXISTS pricing_accessibility (
    id BIGSERIAL PRIMARY KEY,
    widget_id BIGINT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    no_elevator_charge DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id)
);

-- Stairs charges (per flight range)
CREATE TABLE IF NOT EXISTS pricing_stairs (
    id BIGSERIAL PRIMARY KEY,
    widget_id BIGINT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    stairs_range VARCHAR(10) NOT NULL,
    charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id, stairs_range)
);

-- Walking distance charges
CREATE TABLE IF NOT EXISTS pricing_walking_distance (
    id BIGSERIAL PRIMARY KEY,
    widget_id BIGINT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    distance_type VARCHAR(10) NOT NULL,
    charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id, distance_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pricing_teams_widget ON pricing_teams(widget_id);
CREATE INDEX IF NOT EXISTS idx_pricing_labor_widget ON pricing_labor_estimates(widget_id);
CREATE INDEX IF NOT EXISTS idx_pricing_travel_widget ON pricing_travel(widget_id);
CREATE INDEX IF NOT EXISTS idx_pricing_protection_widget ON pricing_protection(widget_id);
CREATE INDEX IF NOT EXISTS idx_pricing_accessibility_widget ON pricing_accessibility(widget_id);
CREATE INDEX IF NOT EXISTS idx_pricing_stairs_widget ON pricing_stairs(widget_id);
CREATE INDEX IF NOT EXISTS idx_pricing_walking_widget ON pricing_walking_distance(widget_id);
