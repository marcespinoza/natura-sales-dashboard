-- Create a SECURITY DEFINER function to delete a purchase and all related records
-- This bypasses RLS to ensure all related records can be deleted

CREATE OR REPLACE FUNCTION delete_purchase_cascade(p_purchase_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete points_ledger records first
  DELETE FROM points_ledger WHERE purchase_id = p_purchase_id;
  
  -- Delete payments
  DELETE FROM payments WHERE purchase_id = p_purchase_id;
  
  -- Delete the purchase
  DELETE FROM purchases WHERE id = p_purchase_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_purchase_cascade(UUID) TO authenticated;
