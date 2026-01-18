-- ============================================
-- Finance Module Schema
-- Household finance tracking: accounts, categories, transactions, recurring bills
-- ============================================

-- 1. FINANCE ACCOUNTS TABLE
-- Bank accounts, cash, credit cards
CREATE TABLE IF NOT EXISTS public.finance_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'credit')),
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'TWD',
    icon TEXT DEFAULT 'mdi-wallet',
    color TEXT DEFAULT '#4CAF50',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;

-- 2. FINANCE CATEGORIES TABLE
-- Pre-set + custom expense/income categories
CREATE TABLE IF NOT EXISTS public.finance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE, -- NULL for system categories
    name TEXT NOT NULL,
    name_en TEXT,
    icon TEXT DEFAULT 'mdi-tag',
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    is_system BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;

-- 3. FINANCE RECURRING TABLE
-- Recurring bill/income templates (must be created before transactions)
CREATE TABLE IF NOT EXISTS public.finance_recurring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'yearly')),
    due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
    active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.finance_recurring ENABLE ROW LEVEL SECURITY;

-- 4. FINANCE TRANSACTIONS TABLE
-- All money movements
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    recurring_id UUID REFERENCES public.finance_recurring(id) ON DELETE SET NULL,
    transfer_to_account_id UUID REFERENCES public.finance_accounts(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

-- 5. FINANCE RECURRING STATUS TABLE
-- Monthly tracking of recurring items
CREATE TABLE IF NOT EXISTS public.finance_recurring_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recurring_id UUID NOT NULL REFERENCES public.finance_recurring(id) ON DELETE CASCADE,
    year_month TEXT NOT NULL, -- Format: YYYY-MM
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid')) DEFAULT 'pending',
    paid_date DATE,
    actual_amount DECIMAL(15, 2),
    transaction_id UUID REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(recurring_id, year_month)
);

ALTER TABLE public.finance_recurring_status ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- FINANCE ACCOUNTS POLICIES
CREATE POLICY "Users can view their household accounts"
    ON public.finance_accounts FOR SELECT
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert accounts for their household"
    ON public.finance_accounts FOR INSERT
    WITH CHECK (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their household accounts"
    ON public.finance_accounts FOR UPDATE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their household accounts"
    ON public.finance_accounts FOR DELETE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

-- FINANCE CATEGORIES POLICIES
CREATE POLICY "Users can view system and household categories"
    ON public.finance_categories FOR SELECT
    USING (
        is_system = TRUE
        OR household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert categories for their household"
    ON public.finance_categories FOR INSERT
    WITH CHECK (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their household categories"
    ON public.finance_categories FOR UPDATE
    USING (
        is_system = FALSE
        AND household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their household categories"
    ON public.finance_categories FOR DELETE
    USING (
        is_system = FALSE
        AND household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

-- FINANCE TRANSACTIONS POLICIES
CREATE POLICY "Users can view their household transactions"
    ON public.finance_transactions FOR SELECT
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transactions for their household"
    ON public.finance_transactions FOR INSERT
    WITH CHECK (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their household transactions"
    ON public.finance_transactions FOR UPDATE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their household transactions"
    ON public.finance_transactions FOR DELETE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

-- FINANCE RECURRING POLICIES
CREATE POLICY "Users can view their household recurring items"
    ON public.finance_recurring FOR SELECT
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert recurring items for their household"
    ON public.finance_recurring FOR INSERT
    WITH CHECK (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their household recurring items"
    ON public.finance_recurring FOR UPDATE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their household recurring items"
    ON public.finance_recurring FOR DELETE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
        )
    );

-- FINANCE RECURRING STATUS POLICIES
CREATE POLICY "Users can view their household recurring status"
    ON public.finance_recurring_status FOR SELECT
    USING (
        recurring_id IN (
            SELECT id FROM public.finance_recurring WHERE household_id IN (
                SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert recurring status for their household"
    ON public.finance_recurring_status FOR INSERT
    WITH CHECK (
        recurring_id IN (
            SELECT id FROM public.finance_recurring WHERE household_id IN (
                SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their household recurring status"
    ON public.finance_recurring_status FOR UPDATE
    USING (
        recurring_id IN (
            SELECT id FROM public.finance_recurring WHERE household_id IN (
                SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete their household recurring status"
    ON public.finance_recurring_status FOR DELETE
    USING (
        recurring_id IN (
            SELECT id FROM public.finance_recurring WHERE household_id IN (
                SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_finance_accounts_household ON public.finance_accounts(household_id);
CREATE INDEX idx_finance_transactions_household ON public.finance_transactions(household_id);
CREATE INDEX idx_finance_transactions_date ON public.finance_transactions(date);
CREATE INDEX idx_finance_transactions_account ON public.finance_transactions(account_id);
CREATE INDEX idx_finance_recurring_household ON public.finance_recurring(household_id);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_finance_accounts
    BEFORE UPDATE ON public.finance_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_finance_categories
    BEFORE UPDATE ON public.finance_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_finance_transactions
    BEFORE UPDATE ON public.finance_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_finance_recurring
    BEFORE UPDATE ON public.finance_recurring
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_finance_recurring_status
    BEFORE UPDATE ON public.finance_recurring_status
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- DEFAULT SYSTEM CATEGORIES
-- ============================================

INSERT INTO public.finance_categories (name, name_en, icon, type, is_system, sort_order) VALUES
    -- Expense Categories
    ('餐飲', 'Food & Dining', 'mdi-food', 'expense', TRUE, 1),
    ('交通', 'Transportation', 'mdi-car', 'expense', TRUE, 2),
    ('住房', 'Housing', 'mdi-home', 'expense', TRUE, 3),
    ('水電瓦斯', 'Utilities', 'mdi-lightning-bolt', 'expense', TRUE, 4),
    ('購物', 'Shopping', 'mdi-shopping', 'expense', TRUE, 5),
    ('娛樂', 'Entertainment', 'mdi-gamepad-variant', 'expense', TRUE, 6),
    ('醫療', 'Healthcare', 'mdi-medical-bag', 'expense', TRUE, 7),
    ('教育', 'Education', 'mdi-school', 'expense', TRUE, 8),
    ('轉帳', 'Transfer', 'mdi-bank-transfer', 'expense', TRUE, 9),
    ('其他', 'Other', 'mdi-dots-horizontal', 'expense', TRUE, 10),
    -- Income Categories
    ('薪資', 'Salary', 'mdi-cash', 'income', TRUE, 1),
    ('副業收入', 'Side Income', 'mdi-briefcase', 'income', TRUE, 2),
    ('獎金', 'Bonus', 'mdi-gift', 'income', TRUE, 3),
    ('投資收益', 'Investment Returns', 'mdi-chart-line', 'income', TRUE, 4),
    ('其他收入', 'Other Income', 'mdi-dots-horizontal', 'income', TRUE, 5);
