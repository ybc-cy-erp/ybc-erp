-- Migration 012: Fix GL auto-posting trigger
-- Author: AI Assistant
-- Date: 2026-03-02
-- Description: Fix auto_post_gl_entry to use correct journal_entries schema

-- =====================
-- 1. DROP OLD FUNCTION
-- =====================
DROP FUNCTION IF EXISTS auto_post_gl_entry() CASCADE;

-- =====================
-- 2. CREATE FIXED FUNCTION
-- =====================
CREATE OR REPLACE FUNCTION auto_post_gl_entry()
RETURNS TRIGGER AS $$
DECLARE
  rule_record RECORD;
  doc_amount DECIMAL(15,2);
  debit_account_id UUID;
  credit_account_id UUID;
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
      
      -- Get debit account ID by code
      SELECT id INTO debit_account_id
      FROM chart_of_accounts
      WHERE tenant_id = NEW.tenant_id
        AND account_code = rule_record.debit_account_code
      LIMIT 1;
      
      -- Get credit account ID by code
      SELECT id INTO credit_account_id
      FROM chart_of_accounts
      WHERE tenant_id = NEW.tenant_id
        AND account_code = rule_record.credit_account_code
      LIMIT 1;
      
      -- Check if both accounts found
      IF debit_account_id IS NULL OR credit_account_id IS NULL THEN
        RAISE NOTICE 'GL accounts not found for codes % and %', 
          rule_record.debit_account_code, rule_record.credit_account_code;
        RETURN NEW;
      END IF;
      
      -- Create journal entry with double-entry
      INSERT INTO journal_entries (
        tenant_id,
        document_id,
        entry_date,
        description,
        debit_account,
        credit_account,
        amount,
        currency,
        created_at
      ) VALUES (
        NEW.tenant_id,
        NEW.id,
        NEW.doc_date,
        rule_record.debit_description || ' / ' || rule_record.credit_description || ' - ' || NEW.doc_number,
        debit_account_id,
        credit_account_id,
        doc_amount,
        COALESCE(NEW.currency, 'EUR'),
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
      
      RAISE NOTICE 'GL entry created for doc % (% EUR)', NEW.doc_number, doc_amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- 3. CREATE TRIGGER
-- =====================
DROP TRIGGER IF EXISTS trigger_auto_post_gl ON document_journal;

CREATE TRIGGER trigger_auto_post_gl
  AFTER INSERT OR UPDATE ON document_journal
  FOR EACH ROW
  EXECUTE FUNCTION auto_post_gl_entry();

COMMENT ON TRIGGER trigger_auto_post_gl ON document_journal IS 'Automatically creates GL entries when document is posted (FIXED)';
