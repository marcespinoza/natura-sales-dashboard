-- Add DELETE policy for points_ledger table
-- This allows authenticated users to delete points_ledger records

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Allow delete points_ledger" ON points_ledger;

-- Create policy to allow authenticated users to delete points_ledger records
CREATE POLICY "Allow delete points_ledger"
ON points_ledger
FOR DELETE
TO authenticated
USING (true);
