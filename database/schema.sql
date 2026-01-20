-- Pricing Configuration Database Schema
-- This schema stores all pricing settings for the moving widget

-- Main widget configuration table
CREATE TABLE widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team pricing options (move, loaders, unloading)
CREATE TABLE pricing_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    team_group VARCHAR(20) NOT NULL, -- 'move', 'loaders', 'unloading'
    team_option VARCHAR(20) NOT NULL, -- '2-1', '3-1', '3-2', '4-2', 'loaders-2', 'loaders-3'
    rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    minimum_hours DECIMAL(5, 2) NOT NULL DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id, team_group, team_option)
);

-- Labor estimate ranges by property type
CREATE TABLE pricing_labor_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    estimate_group VARCHAR(20) NOT NULL, -- 'home', 'storage', 'office'
    estimate_option VARCHAR(20) NOT NULL, -- 'studio', '1bed', '2bed', etc.
    min_labor DECIMAL(5, 2) NOT NULL DEFAULT 2,
    max_labor DECIMAL(5, 2) NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id, estimate_group, estimate_option)
);

-- Travel and distance pricing
CREATE TABLE pricing_travel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    travel_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.75, -- Multiplier (0.75 = 75%)
    price_per_mile DECIMAL(10, 2) NOT NULL DEFAULT 2.50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id)
);

-- Protection/insurance pricing
CREATE TABLE pricing_protection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    protection_charge DECIMAL(10, 2) NOT NULL DEFAULT 15.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id)
);

-- Accessibility charges
CREATE TABLE pricing_accessibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    no_elevator_charge DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id)
);

-- Stairs charges (per flight range)
CREATE TABLE pricing_stairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    stairs_range VARCHAR(10) NOT NULL, -- '1-2', '3-4', '5+'
    charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id, stairs_range)
);

-- Walking distance charges
CREATE TABLE pricing_walking_distance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    distance_type VARCHAR(10) NOT NULL, -- 'short', 'medium', 'long'
    charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(widget_id, distance_type)
);

-- Indexes for faster queries
CREATE INDEX idx_pricing_teams_widget ON pricing_teams(widget_id);
CREATE INDEX idx_pricing_labor_widget ON pricing_labor_estimates(widget_id);
CREATE INDEX idx_pricing_travel_widget ON pricing_travel(widget_id);
CREATE INDEX idx_pricing_protection_widget ON pricing_protection(widget_id);
CREATE INDEX idx_pricing_accessibility_widget ON pricing_accessibility(widget_id);
CREATE INDEX idx_pricing_stairs_widget ON pricing_stairs(widget_id);
CREATE INDEX idx_pricing_walking_widget ON pricing_walking_distance(widget_id);

-- ============================================
-- INSERT DEFAULT PRICING FOR A NEW WIDGET
-- ============================================

-- Function to insert default pricing for a new widget
CREATE OR REPLACE FUNCTION insert_default_pricing(p_widget_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert team pricing (move)
    INSERT INTO pricing_teams (widget_id, team_group, team_option, rate, minimum_hours) VALUES
        (p_widget_id, 'move', '2-1', 120.00, 2),
        (p_widget_id, 'move', '3-1', 180.00, 3),
        (p_widget_id, 'move', '3-2', 220.00, 2),
        (p_widget_id, 'move', '4-2', 300.00, 2);

    -- Insert team pricing (loaders)
    INSERT INTO pricing_teams (widget_id, team_group, team_option, rate, minimum_hours) VALUES
        (p_widget_id, 'loaders', 'loaders-2', 120.00, 2),
        (p_widget_id, 'loaders', 'loaders-3', 180.00, 2);

    -- Insert team pricing (unloading)
    INSERT INTO pricing_teams (widget_id, team_group, team_option, rate, minimum_hours) VALUES
        (p_widget_id, 'unloading', '2-1', 0.00, 2),
        (p_widget_id, 'unloading', '3-1', 0.00, 2);

    -- Insert labor estimates (home)
    INSERT INTO pricing_labor_estimates (widget_id, estimate_group, estimate_option, min_labor, max_labor) VALUES
        (p_widget_id, 'home', 'studio', 2.0, 3.0),
        (p_widget_id, 'home', '1bed', 2.5, 3.5),
        (p_widget_id, 'home', '2bed', 3.0, 4.0),
        (p_widget_id, 'home', '3bed', 4.0, 5.0),
        (p_widget_id, 'home', '4bed', 5.0, 6.0),
        (p_widget_id, 'home', '5bed', 6.0, 8.0);

    -- Insert labor estimates (storage)
    INSERT INTO pricing_labor_estimates (widget_id, estimate_group, estimate_option, min_labor, max_labor) VALUES
        (p_widget_id, 'storage', '25', 1.0, 1.5),
        (p_widget_id, 'storage', '50', 1.5, 2.0),
        (p_widget_id, 'storage', '75', 2.0, 2.5),
        (p_widget_id, 'storage', '100', 2.5, 3.0),
        (p_widget_id, 'storage', '200', 3.0, 4.0),
        (p_widget_id, 'storage', '300', 4.0, 5.0);

    -- Insert labor estimates (office)
    INSERT INTO pricing_labor_estimates (widget_id, estimate_group, estimate_option, min_labor, max_labor) VALUES
        (p_widget_id, 'office', '1-4', 2.0, 3.0),
        (p_widget_id, 'office', '5-9', 3.0, 4.0),
        (p_widget_id, 'office', '10-19', 4.0, 5.0),
        (p_widget_id, 'office', '20-49', 5.0, 7.0),
        (p_widget_id, 'office', '50-99', 7.0, 9.0),
        (p_widget_id, 'office', 'over-100', 10.0, 12.0);

    -- Insert travel pricing
    INSERT INTO pricing_travel (widget_id, travel_rate, price_per_mile) VALUES
        (p_widget_id, 0.75, 2.50);

    -- Insert protection pricing
    INSERT INTO pricing_protection (widget_id, protection_charge) VALUES
        (p_widget_id, 15.00);

    -- Insert accessibility pricing
    INSERT INTO pricing_accessibility (widget_id, no_elevator_charge) VALUES
        (p_widget_id, 25.00);

    -- Insert stairs charges
    INSERT INTO pricing_stairs (widget_id, stairs_range, charge) VALUES
        (p_widget_id, '1-2', 0.00),
        (p_widget_id, '3-4', 25.00),
        (p_widget_id, '5+', 50.00);

    -- Insert walking distance charges
    INSERT INTO pricing_walking_distance (widget_id, distance_type, charge) VALUES
        (p_widget_id, 'short', 0.00),
        (p_widget_id, 'medium', 15.00),
        (p_widget_id, 'long', 30.00);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EXAMPLE QUERIES
-- ============================================

-- Get all pricing for a widget (as JSON)
-- SELECT
--     w.id,
--     w.name,
--     json_build_object(
--         'teams', (
--             SELECT json_object_agg(team_group, team_data)
--             FROM (
--                 SELECT team_group, json_object_agg(team_option, json_build_object('rate', rate, 'minimumHours', minimum_hours)) as team_data
--                 FROM pricing_teams WHERE widget_id = w.id
--                 GROUP BY team_group
--             ) t
--         ),
--         'travelRate', pt.travel_rate,
--         'pricePerMile', pt.price_per_mile,
--         'protectionCharge', pp.protection_charge,
--         'accessibility', json_build_object(
--             'noElevatorCharge', pa.no_elevator_charge,
--             'stairsCharge', (SELECT json_object_agg(stairs_range, charge) FROM pricing_stairs WHERE widget_id = w.id),
--             'walkingDistance', (SELECT json_object_agg(distance_type, charge) FROM pricing_walking_distance WHERE widget_id = w.id)
--         )
--     ) as pricing
-- FROM widgets w
-- LEFT JOIN pricing_travel pt ON pt.widget_id = w.id
-- LEFT JOIN pricing_protection pp ON pp.widget_id = w.id
-- LEFT JOIN pricing_accessibility pa ON pa.widget_id = w.id
-- WHERE w.id = 'your-widget-id';

-- ============================================
-- UPDATE QUERIES
-- ============================================

-- Update team rate
-- UPDATE pricing_teams
-- SET rate = 150.00, updated_at = CURRENT_TIMESTAMP
-- WHERE widget_id = 'your-widget-id' AND team_group = 'move' AND team_option = '2-1';

-- Update travel rate
-- UPDATE pricing_travel
-- SET travel_rate = 0.80, updated_at = CURRENT_TIMESTAMP
-- WHERE widget_id = 'your-widget-id';

-- Update stairs charge
-- UPDATE pricing_stairs
-- SET charge = 30.00, updated_at = CURRENT_TIMESTAMP
-- WHERE widget_id = 'your-widget-id' AND stairs_range = '3-4';
