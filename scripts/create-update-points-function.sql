-- Create a SECURITY DEFINER function to update points_balance
-- This bypasses RLS policies to avoid recursion issues

CREATE OR REPLACE FUNCTION update_client_points(
  p_client_id UUID,
  p_new_balance INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET points_balance = p_new_balance
  WHERE id = p_client_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_client_points(UUID, INTEGER) TO authenticated;
