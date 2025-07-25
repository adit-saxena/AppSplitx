/*
  # Seed Sample Data for SplitX AI

  1. Sample Data
    - Create sample projects for demo purposes
    - Add sample A/B tests with different statuses
    - Include sample variants and test results
    - Generate realistic analytics data

  2. Demo Content
    - Various test scenarios (homepage, checkout, signup)
    - Different test statuses and results
    - Sample conversion data for dashboard metrics
*/

-- Note: This will only work after users sign up, so we'll create a function
-- that can be called to seed data for a specific user

CREATE OR REPLACE FUNCTION seed_sample_data_for_user(user_id uuid)
RETURNS void AS $$
DECLARE
  project1_id uuid;
  project2_id uuid;
  test1_id uuid;
  test2_id uuid;
  test3_id uuid;
  test4_id uuid;
  variant1_control_id uuid;
  variant1_variation_id uuid;
  variant2_control_id uuid;
  variant2_variation_id uuid;
  variant3_control_id uuid;
  variant3_variation_id uuid;
  variant4_control_id uuid;
  variant4_variation_id uuid;
BEGIN
  -- Insert sample projects
  INSERT INTO projects (id, user_id, name, domain, description, created_at)
  VALUES 
    (gen_random_uuid(), user_id, 'E-commerce Store', 'shop.example.com', 'Main e-commerce website with product catalog and checkout', now() - interval '30 days'),
    (gen_random_uuid(), user_id, 'SaaS Landing Page', 'app.example.com', 'Product landing page and signup flow', now() - interval '20 days')
  RETURNING id INTO project1_id;

  -- Get the project IDs
  SELECT id INTO project1_id FROM projects WHERE user_id = seed_sample_data_for_user.user_id AND name = 'E-commerce Store';
  SELECT id INTO project2_id FROM projects WHERE user_id = seed_sample_data_for_user.user_id AND name = 'SaaS Landing Page';

  -- Insert sample tests
  INSERT INTO tests (id, project_id, name, description, status, traffic_allocation, start_date, end_date, created_at)
  VALUES 
    (gen_random_uuid(), project1_id, 'Homepage Hero CTA', 'Testing different call-to-action buttons on homepage hero section', 'running', 100, now() - interval '5 days', now() + interval '10 days', now() - interval '5 days'),
    (gen_random_uuid(), project1_id, 'Product Page Layout', 'Comparing single column vs two column product layouts', 'running', 80, now() - interval '8 days', now() + interval '7 days', now() - interval '8 days'),
    (gen_random_uuid(), project1_id, 'Checkout Flow', 'Single page vs multi-step checkout process', 'paused', 50, now() - interval '12 days', now() + interval '3 days', now() - interval '12 days'),
    (gen_random_uuid(), project2_id, 'Email Signup Form', 'Testing form placement and copy variations', 'completed', 100, now() - interval '25 days', now() - interval '5 days', now() - interval '25 days')
  RETURNING id INTO test1_id;

  -- Get test IDs
  SELECT id INTO test1_id FROM tests WHERE project_id = project1_id AND name = 'Homepage Hero CTA';
  SELECT id INTO test2_id FROM tests WHERE project_id = project1_id AND name = 'Product Page Layout';
  SELECT id INTO test3_id FROM tests WHERE project_id = project1_id AND name = 'Checkout Flow';
  SELECT id INTO test4_id FROM tests WHERE project_id = project2_id AND name = 'Email Signup Form';

  -- Insert variants for Test 1 (Homepage Hero CTA)
  INSERT INTO variants (id, test_id, name, is_control, traffic_percentage, html_changes, created_at)
  VALUES 
    (gen_random_uuid(), test1_id, 'Original Button', true, 50, '{"button_text": "Shop Now", "button_color": "#007bff"}', now() - interval '5 days'),
    (gen_random_uuid(), test1_id, 'Green CTA Button', false, 50, '{"button_text": "Start Shopping", "button_color": "#28a745"}', now() - interval '5 days')
  RETURNING id INTO variant1_control_id;

  -- Get variant IDs for test 1
  SELECT id INTO variant1_control_id FROM variants WHERE test_id = test1_id AND is_control = true;
  SELECT id INTO variant1_variation_id FROM variants WHERE test_id = test1_id AND is_control = false;

  -- Insert variants for Test 2 (Product Page Layout)
  INSERT INTO variants (id, test_id, name, is_control, traffic_percentage, html_changes, created_at)
  VALUES 
    (gen_random_uuid(), test2_id, 'Single Column', true, 50, '{"layout": "single_column", "image_position": "top"}', now() - interval '8 days'),
    (gen_random_uuid(), test2_id, 'Two Column', false, 50, '{"layout": "two_column", "image_position": "left"}', now() - interval '8 days')
  RETURNING id INTO variant2_control_id;

  -- Get variant IDs for test 2
  SELECT id INTO variant2_control_id FROM variants WHERE test_id = test2_id AND is_control = true;
  SELECT id INTO variant2_variation_id FROM variants WHERE test_id = test2_id AND is_control = false;

  -- Insert variants for Test 3 (Checkout Flow)
  INSERT INTO variants (id, test_id, name, is_control, traffic_percentage, html_changes, created_at)
  VALUES 
    (gen_random_uuid(), test3_id, 'Single Page Checkout', true, 50, '{"checkout_type": "single_page", "steps": 1}', now() - interval '12 days'),
    (gen_random_uuid(), test3_id, 'Multi-Step Checkout', false, 50, '{"checkout_type": "multi_step", "steps": 3}', now() - interval '12 days')
  RETURNING id INTO variant3_control_id;

  -- Get variant IDs for test 3
  SELECT id INTO variant3_control_id FROM variants WHERE test_id = test3_id AND is_control = true;
  SELECT id INTO variant3_variation_id FROM variants WHERE test_id = test3_id AND is_control = false;

  -- Insert variants for Test 4 (Email Signup Form)
  INSERT INTO variants (id, test_id, name, is_control, traffic_percentage, html_changes, created_at)
  VALUES 
    (gen_random_uuid(), test4_id, 'Header Form', true, 50, '{"form_position": "header", "form_title": "Get Started"}', now() - interval '25 days'),
    (gen_random_uuid(), test4_id, 'Sidebar Form', false, 50, '{"form_position": "sidebar", "form_title": "Join Now"}', now() - interval '25 days')
  RETURNING id INTO variant4_control_id;

  -- Get variant IDs for test 4
  SELECT id INTO variant4_control_id FROM variants WHERE test_id = test4_id AND is_control = true;
  SELECT id INTO variant4_variation_id FROM variants WHERE test_id = test4_id AND is_control = false;

  -- Generate sample test sessions and conversions
  -- Test 1 sessions (Homepage Hero CTA - Running)
  INSERT INTO test_sessions (test_id, variant_id, visitor_id, created_at)
  SELECT 
    test1_id,
    CASE WHEN random() < 0.5 THEN variant1_control_id ELSE variant1_variation_id END,
    'visitor_' || generate_random_uuid(),
    now() - interval '5 days' + (random() * interval '5 days')
  FROM generate_series(1, 2450);

  -- Test 1 conversions (15% improvement for variation)
  INSERT INTO conversions (test_id, variant_id, session_id, event_name, event_value, created_at)
  SELECT 
    ts.test_id,
    ts.variant_id,
    ts.id,
    'purchase',
    (random() * 200 + 50)::decimal(10,2),
    ts.created_at + (random() * interval '1 hour')
  FROM test_sessions ts
  WHERE ts.test_id = test1_id
  AND random() < CASE 
    WHEN ts.variant_id = variant1_control_id THEN 0.0324 -- 3.24% conversion
    ELSE 0.0372 -- 3.72% conversion (15% improvement)
  END;

  -- Test 2 sessions (Product Page Layout - Running)
  INSERT INTO test_sessions (test_id, variant_id, visitor_id, created_at)
  SELECT 
    test2_id,
    CASE WHEN random() < 0.5 THEN variant2_control_id ELSE variant2_variation_id END,
    'visitor_' || generate_random_uuid(),
    now() - interval '8 days' + (random() * interval '8 days')
  FROM generate_series(1, 1920);

  -- Test 2 conversions (8% improvement for variation)
  INSERT INTO conversions (test_id, variant_id, session_id, event_name, event_value, created_at)
  SELECT 
    ts.test_id,
    ts.variant_id,
    ts.id,
    'add_to_cart',
    (random() * 150 + 25)::decimal(10,2),
    ts.created_at + (random() * interval '30 minutes')
  FROM test_sessions ts
  WHERE ts.test_id = test2_id
  AND random() < CASE 
    WHEN ts.variant_id = variant2_control_id THEN 0.0287 -- 2.87% conversion
    ELSE 0.0310 -- 3.10% conversion (8% improvement)
  END;

  -- Test 3 sessions (Checkout Flow - Paused)
  INSERT INTO test_sessions (test_id, variant_id, visitor_id, created_at)
  SELECT 
    test3_id,
    CASE WHEN random() < 0.5 THEN variant3_control_id ELSE variant3_variation_id END,
    'visitor_' || generate_random_uuid(),
    now() - interval '12 days' + (random() * interval '7 days')
  FROM generate_series(1, 1670);

  -- Test 3 conversions (22% improvement for variation)
  INSERT INTO conversions (test_id, variant_id, session_id, event_name, event_value, created_at)
  SELECT 
    ts.test_id,
    ts.variant_id,
    ts.id,
    'checkout_complete',
    (random() * 300 + 100)::decimal(10,2),
    ts.created_at + (random() * interval '2 hours')
  FROM test_sessions ts
  WHERE ts.test_id = test3_id
  AND random() < CASE 
    WHEN ts.variant_id = variant3_control_id THEN 0.0412 -- 4.12% conversion
    ELSE 0.0503 -- 5.03% conversion (22% improvement)
  END;

  -- Test 4 sessions (Email Signup Form - Completed)
  INSERT INTO test_sessions (test_id, variant_id, visitor_id, created_at)
  SELECT 
    test4_id,
    CASE WHEN random() < 0.5 THEN variant4_control_id ELSE variant4_variation_id END,
    'visitor_' || generate_random_uuid(),
    now() - interval '25 days' + (random() * interval '20 days')
  FROM generate_series(1, 3300);

  -- Test 4 conversions (5% improvement for variation)
  INSERT INTO conversions (test_id, variant_id, session_id, event_name, event_value, created_at)
  SELECT 
    ts.test_id,
    ts.variant_id,
    ts.id,
    'email_signup',
    0,
    ts.created_at + (random() * interval '10 minutes')
  FROM test_sessions ts
  WHERE ts.test_id = test4_id
  AND random() < CASE 
    WHEN ts.variant_id = variant4_control_id THEN 0.0195 -- 1.95% conversion
    ELSE 0.0205 -- 2.05% conversion (5% improvement)
  END;

END;
$$ LANGUAGE plpgsql;

-- Function to generate random UUID as text (for visitor IDs)
CREATE OR REPLACE FUNCTION generate_random_uuid()
RETURNS text AS $$
BEGIN
  RETURN gen_random_uuid()::text;
END;
$$ LANGUAGE plpgsql;