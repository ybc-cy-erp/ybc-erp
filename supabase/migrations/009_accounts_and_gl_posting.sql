-- Migration 009: Accounts table and GL Auto-posting
-- Author: AI Assistant
-- Date: 2026-03-02
-- Description: Universal accounts table (cash, bank, crypto) + GL auto-posting triggers

-- =====================
-- 1. ACCOUNTS TABLE
-- =====================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('cash', 'bank', 'crypto')),
  account_name VARCHAR(255) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  balance DECIMAL(15,2) DEFAULT 0,
  
  -- Bank-specific fields
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(100),
  
  -- Crypto-specific fields
  network VARCHAR(50), -- ethereum, bsc, tron, bitcoin, arbitrum, optimism
  wallet_address VARCHAR(255),
  
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_tenant_id ON accounts(tenant_id);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_status ON accounts(status);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounts_tenant_policy ON accounts
  USING (tenant_id::text = COALESCE((auth.jwt() -> 'user_metadata' ->> 'tenant_id'), (auth.jwt() ->> 'tenant_id')))
  WITH CHECK (tenant_id::text = COALESCE((auth.jwt() -> 'user_metadata' ->> 'tenant_id'), (auth.jwt() ->> 'tenant_id')));

-- =====================
-- 2. UPDATE CASH_DOCUMENTS
-- =====================
-- Add account_id to link ПКО/РКО to any account (not just cash)
ALTER TABLE document_journal
  ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX idx_document_journal_account ON document_journal(account_id);

COMMENT ON COLUMN document_journal.account_id IS 'Universal account link (cash/bank/crypto)';

-- =====================
-- 3. GL POSTING RULES TABLE
-- =====================
CREATE TABLE gl_posting_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  doc_type VARCHAR(50) NOT NULL, -- PKO, RKO, bill, payment, membership, etc.
  
  -- Debit entry
  debit_account_code VARCHAR(20) NOT NULL,
  debit_description VARCHAR(255),
  
  -- Credit entry
  credit_account_code VARCHAR(20) NOT NULL,
  credit_description VARCHAR(255),
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gl_posting_rules_tenant ON gl_posting_rules(tenant_id);
CREATE INDEX idx_gl_posting_rules_doc_type ON gl_posting_rules(doc_type);

ALTER TABLE gl_posting_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY gl_posting_rules_tenant_policy ON gl_posting_rules
  USING (tenant_id::text = COALESCE((auth.jwt() -> 'user_metadata' ->> 'tenant_id'), (auth.jwt() ->> 'tenant_id')))
  WITH CHECK (tenant_id::text = COALESCE((auth.jwt() -> 'user_metadata' ->> 'tenant_id'), (auth.jwt() ->> 'tenant_id')));

-- =====================
-- 4. SEED DEFAULT ACCOUNTS
-- =====================
-- Insert default cash account for YBC demo tenant
INSERT INTO accounts (tenant_id, account_type, account_name, currency, balance)
SELECT 
  id,
  'cash',
  'Основна каса',
  'EUR',
  0
FROM tenants
WHERE name = 'YBC Cyprus';

-- =====================
-- 5. SEED GL POSTING RULES
-- =====================
INSERT INTO gl_posting_rules (tenant_id, rule_name, doc_type, debit_account_code, debit_description, credit_account_code, credit_description)
SELECT 
  id,
  'ПКО - Приходний касовий ордер',
  'PKO',
  '100', -- Каса
  'Надходження грошових коштів',
  '400', -- Дохід
  'Дохід від операційної діяльності'
FROM tenants
WHERE name = 'YBC Cyprus';

INSERT INTO gl_posting_rules (tenant_id, rule_name, doc_type, debit_account_code, debit_description, credit_account_code, credit_description)
SELECT 
  id,
  'РКО - Видатковий касовий ордер',
  'RKO',
  '500', -- Витрати
  'Операційні витрати',
  '100', -- Каса
  'Видача грошових коштів'
FROM tenants
WHERE name = 'YBC Cyprus';

INSERT INTO gl_posting_rules (tenant_id, rule_name, doc_type, debit_account_code, debit_description, credit_account_code, credit_description)
SELECT 
  id,
  'Рахунок - Нарахування витрат',
  'bill_accrual',
  '500', -- Витрати
  'Нарахування витрат',
  '200', -- Кредиторська заборгованість
  'Заборгованість перед постачальником'
FROM tenants
WHERE name = 'YBC Cyprus';

INSERT INTO gl_posting_rules (tenant_id, rule_name, doc_type, debit_account_code, debit_description, credit_account_code, credit_description)
SELECT 
  id,
  'Оплата рахунку',
  'bill_payment',
  '200', -- Кредиторська заборгованість
  'Погашення заборгованості',
  '100', -- Каса
  'Оплата постачальнику'
FROM tenants
WHERE name = 'YBC Cyprus';

INSERT INTO gl_posting_rules (tenant_id, rule_name, doc_type, debit_account_code, debit_description, credit_account_code, credit_description)
SELECT 
  id,
  'Членство - Дохід від продажу',
  'membership',
  '100', -- Каса
  'Оплата членства',
  '400', -- Дохід
  'Дохід від членства'
FROM tenants
WHERE name = 'YBC Cyprus';

-- =====================
-- 6. FUNCTION: Auto-post GL entries
-- =====================
CREATE OR REPLACE FUNCTION auto_post_gl_entry()
RETURNS TRIGGER AS $$
DECLARE
  rule_record RECORD;
  doc_amount DECIMAL(15,2);
BEGIN
  -- Only process when status changes to 'posted'
  IF NEW.status = 'posted' AND (OLD.status IS NULL OR OLD.status != 'posted') THEN
    
    -- Find posting rule for this document type
    SELECT * INTO rule_record
    FROM gl_posting_rules
    WHERE tenant_id = NEW.tenant_id
      AND doc_type = NEW.doc_type
      AND is_active = TRUE
    LIMIT 1;
    
    IF rule_record IS NOT NULL THEN
      doc_amount := COALESCE(NEW.amount, 0);
      
      -- Create debit entry
      INSERT INTO journal_entries (
        tenant_id,
        entry_date,
        account_code,
        description,
        debit,
        credit,
        document_id,
        document_type,
        created_at
      ) VALUES (
        NEW.tenant_id,
        NEW.doc_date,
        rule_record.debit_account_code,
        rule_record.debit_description || ' - ' || NEW.doc_number,
        doc_amount,
        0,
        NEW.id,
        NEW.doc_type,
        NOW()
      );
      
      -- Create credit entry
      INSERT INTO journal_entries (
        tenant_id,
        entry_date,
        account_code,
        description,
        debit,
        credit,
        document_id,
        document_type,
        created_at
      ) VALUES (
        NEW.tenant_id,
        NEW.doc_date,
        rule_record.credit_account_code,
        rule_record.credit_description || ' - ' || NEW.doc_number,
        0,
        doc_amount,
        NEW.id,
        NEW.doc_type,
        NOW()
      );
      
      -- Update account balance if account_id is set
      IF NEW.account_id IS NOT NULL THEN
        IF NEW.doc_type = 'PKO' THEN
          -- Приход - увеличиваем баланс
          UPDATE accounts 
          SET balance = balance + doc_amount,
              updated_at = NOW()
          WHERE id = NEW.account_id;
        ELSIF NEW.doc_type = 'RKO' THEN
          -- Расход - уменьшаем баланс
          UPDATE accounts 
          SET balance = balance - doc_amount,
              updated_at = NOW()
          WHERE id = NEW.account_id;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- 7. TRIGGER: Auto-post on document posting
-- =====================
CREATE TRIGGER trigger_auto_post_gl
  AFTER INSERT OR UPDATE ON document_journal
  FOR EACH ROW
  EXECUTE FUNCTION auto_post_gl_entry();

COMMENT ON TRIGGER trigger_auto_post_gl ON document_journal IS 'Automatically creates GL entries when document is posted';

-- =====================
-- 8. UPDATE crypto_wallets to link with accounts
-- =====================
ALTER TABLE crypto_wallets
  ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX idx_crypto_wallets_account ON crypto_wallets(account_id);

COMMENT ON COLUMN crypto_wallets.account_id IS 'Link to unified accounts table';

-- =====================
-- 9. Create default crypto accounts for existing wallets
-- =====================
-- This will be done via service layer when user first accesses wallets page
