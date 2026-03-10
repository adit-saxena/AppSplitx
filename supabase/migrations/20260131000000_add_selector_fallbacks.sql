/*
  # Add Selector Fallback Support
  
  Adds support for multiple fallback selectors and selector stability tracking.
  This ensures tests continue working even if the primary selector changes.
  
  Changes:
  1. Add `fallback_selectors` (text[]): Array of fallback CSS selectors
  2. Add `selector_stability` (text): Stability rating (high, medium, low)
*/

-- Add fallback selector columns to tests table
ALTER TABLE tests 
  ADD COLUMN IF NOT EXISTS fallback_selectors text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS selector_stability text DEFAULT 'medium';

-- Add comment for documentation
COMMENT ON COLUMN tests.fallback_selectors IS 'Array of fallback CSS selectors to try if primary element_selector fails';
COMMENT ON COLUMN tests.selector_stability IS 'Stability rating of the primary selector: high, medium, or low';
