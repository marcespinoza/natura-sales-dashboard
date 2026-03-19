-- Fix profile update RLS and subtract points on purchase delete

-- 1. Create function to update own profile (bypass RLS issues)
CREATE OR REPLACE FUNCTION update_own_profile(
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET 
    full_name = COALESCE(p_full_name, full_name),
    phone = p_phone,
    address = p_address,
    updated_at = NOW()
  WHERE id = auth.uid();
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION update_own_profile(TEXT, TEXT, TEXT) TO authenticated;

-- 2. Update delete_purchase_cascade to also subtract points from client
CREATE OR REPLACE FUNCTION delete_purchase_cascade(p_purchase_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_points_to_subtract INT;
BEGIN
  -- Get the client_id and points_earned from the purchase
  SELECT client_id, COALESCE(points_earned, 0) 
  INTO v_client_id, v_points_to_subtract
  FROM purchases 
  WHERE id = p_purchase_id;
  
  -- If purchase not found, return false
  IF v_client_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Subtract points from client's balance
  IF v_points_to_subtract > 0 THEN
    UPDATE profiles 
    SET points_balance = GREATEST(0, COALESCE(points_balance, 0) - v_points_to_subtract)
    WHERE id = v_client_id;
  END IF;
  
  -- Delete points_ledger records
  DELETE FROM points_ledger WHERE purchase_id = p_purchase_id;
  
  -- Delete payments
  DELETE FROM payments WHERE purchase_id = p_purchase_id;
  
  -- Delete the purchase
  DELETE FROM purchases WHERE id = p_purchase_id;
  
  RETURN TRUE;
END;
$$;

-- Ensure RLS policy allows users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Also ensure select policy exists
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);
