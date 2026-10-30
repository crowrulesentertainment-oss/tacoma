-- Index the ledger foreign key used by member-email reconciliation audit joins and cleanup.
CREATE INDEX IF NOT EXISTS hub_member_email_reconciliation_audit_ledger_id_idx
ON public.hub_member_email_reconciliation_audit (ledger_id);
