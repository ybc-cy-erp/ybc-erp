-- Migration 011: Cleanup old cash_documents table
-- Author: AI Assistant
-- Date: 2026-03-02
-- Description: Remove old cash_documents table, all cash docs now in document_journal

-- Drop old cash_documents table
-- All PKO/RKO documents are now in document_journal with account_id
DROP TABLE IF EXISTS cash_documents CASCADE;

COMMENT ON TABLE document_journal IS 'Universal document journal: PKO, RKO, invoices, etc. Replaces old cash_documents table';
