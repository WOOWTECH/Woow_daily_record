-- ============================================
-- Atomic Balance Update Function
-- Fixes race condition in balance updates
-- ============================================

-- Function to atomically update account balance
-- This prevents race conditions by performing the operation in a single SQL statement
CREATE OR REPLACE FUNCTION public.update_account_balance_atomic(
    p_account_id UUID,
    p_amount DECIMAL(15, 2),
    p_operation TEXT -- 'add' or 'subtract'
)
RETURNS DECIMAL(15, 2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_balance DECIMAL(15, 2);
BEGIN
    IF p_operation = 'add' THEN
        UPDATE finance_accounts
        SET balance = balance + p_amount,
            updated_at = NOW()
        WHERE id = p_account_id
        RETURNING balance INTO v_new_balance;
    ELSIF p_operation = 'subtract' THEN
        UPDATE finance_accounts
        SET balance = balance - p_amount,
            updated_at = NOW()
        WHERE id = p_account_id
        RETURNING balance INTO v_new_balance;
    ELSE
        RAISE EXCEPTION 'Invalid operation: %. Must be "add" or "subtract"', p_operation;
    END IF;

    IF v_new_balance IS NULL THEN
        RAISE EXCEPTION 'Account not found: %', p_account_id;
    END IF;

    RETURN v_new_balance;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_account_balance_atomic(UUID, DECIMAL, TEXT) TO authenticated;

-- Add a comment for documentation
COMMENT ON FUNCTION public.update_account_balance_atomic IS
'Atomically updates an account balance. Prevents race conditions by using a single UPDATE statement.
Parameters:
  - p_account_id: The UUID of the account to update
  - p_amount: The amount to add or subtract (always positive)
  - p_operation: Either "add" or "subtract"
Returns: The new balance after the update';
