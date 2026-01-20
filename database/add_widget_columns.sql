-- Add missing columns to widgets table
-- Run this in your Supabase SQL Editor

ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS user_id VARCHAR(100) DEFAULT 'anonymous',
ADD COLUMN IF NOT EXISTS name VARCHAR(100) DEFAULT 'My Widget',
ADD COLUMN IF NOT EXISTS company_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS logo TEXT,
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(20) DEFAULT '#1E40AF',
ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS text_color VARCHAR(20) DEFAULT '#1F2937',
ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) DEFAULT 'Get Free Quote',
ADD COLUMN IF NOT EXISTS success_message TEXT DEFAULT 'Thank you! We will contact you within 24 hours to discuss your move.',
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS enable_insurance BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_special_items BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_inventory BOOLEAN DEFAULT true;
