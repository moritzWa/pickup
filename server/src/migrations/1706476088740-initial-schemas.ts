import { MigrationInterface, QueryRunner } from "typeorm";

export class initialSchemas1706476088740 implements MigrationInterface {
    name = "initialSchemas1706476088740";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."currency_code_enum" AS ENUM('AUD', 'EUR', 'GBP', 'USD', 'CAD')`
        );
        await queryRunner.query(
            `CREATE TABLE "exchange_rates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "currency_code" "public"."currency_code_enum" NOT NULL, "exchange_rate_to_usd" numeric NOT NULL, CONSTRAINT "UniqueConstraint" UNIQUE ("date", "currency_code"), CONSTRAINT "PK_33a614bad9e61956079d817ebe2" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "exchange_rates_date_idx" ON "exchange_rates" ("date") `
        );
        await queryRunner.query(
            `CREATE INDEX "exchange_rates_currency_code_idx" ON "exchange_rates" ("currency_code") `
        );
        await queryRunner.query(
            `CREATE TABLE "packs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" text NOT NULL DEFAULT 'paid', "stripe_checkout_session_id" text, "stripe_line_item_id" text, "stripe_product_id" text, "stripe_price_id" text, "size" numeric NOT NULL, "idempotency" text NOT NULL, "client_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_8e10c095e4ee49eca85430ecd0c" UNIQUE ("idempotency"), CONSTRAINT "PK_da3c6e998aaa9331767c51e7f91" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "packs_client_id_index" ON "packs" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "pack_created_at_index" ON "packs" ("created_at") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."user_status_enum" AS ENUM('user', 'pending')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."auth_provider_enum" AS ENUM('firebase')`
        );
        await queryRunner.query(
            `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."user_status_enum" NOT NULL DEFAULT 'user', "phone_number" text, "biometric_public_key" text, "email" text NOT NULL, "name" text, "avatar_image_url" text, "auth_provider" "public"."auth_provider_enum" NOT NULL, "auth_provider_id" text NOT NULL, "has_two_factor_auth" boolean NOT NULL DEFAULT false, "has_mobile" boolean NOT NULL DEFAULT false, "has_push_notifications_enabled" boolean NOT NULL DEFAULT false, "number" integer, "referred_by_code" text, "referred_by_name" text, "stripe_customer_id" text, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), "active_client_id" uuid, "is_superuser" boolean NOT NULL DEFAULT false, "role" text, "has_portfolio_enabled" boolean NOT NULL DEFAULT false, "has_trading_enabled" boolean NOT NULL DEFAULT false, "feature_flags" jsonb, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_1c844df74e011d4b0694ad5b2c" ON "users" ("auth_provider_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "users_has_mobile_idx" ON "users" ("has_mobile") `
        );
        await queryRunner.query(
            `CREATE INDEX "users_active_client_id_idx" ON "users" ("active_client_id") `
        );
        await queryRunner.query(
            `CREATE TABLE "pending_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4dcd5954b4aecb4d483a5c7e7d8" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_52d88bd887025f9814da7d2845" ON "pending_users" ("email") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."cost_basis_algorithm_enum" AS ENUM('lifo', 'fifo', 'hifo', 'share_pooling', 'acb')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."client_accountant_status_enum" AS ENUM('in_progress', 'blocked', 'finished')`
        );
        await queryRunner.query(
            `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "email" text, "created_by_id" uuid, "referral_code" text, "referred_by_code" text, "referred_by_name" text, "has_sent_account_reminder" boolean NOT NULL DEFAULT false, "is_locked" boolean NOT NULL DEFAULT false, "cost_basis_algorithm" "public"."cost_basis_algorithm_enum" NOT NULL DEFAULT 'fifo', "is_dirty" boolean NOT NULL DEFAULT false, "needs_recalculate" boolean NOT NULL DEFAULT false, "has_claimed_twitter" boolean NOT NULL DEFAULT false, "timezone" text, "currency" text NOT NULL DEFAULT 'USD', "country" text NOT NULL DEFAULT 'US', "available_credit_cents" numeric NOT NULL DEFAULT '0', "stripe_customer_id" text, "profile_picture" text NOT NULL DEFAULT '', "rewards" jsonb DEFAULT '[]', "internal_notes" text, "accountant_status" "public"."client_accountant_status_enum", "accountant_notes" text, "should_refresh_assets" boolean, "is_recalculating" boolean NOT NULL DEFAULT false, "default_to_floor" boolean NOT NULL DEFAULT false, "lock_counter" numeric, "last_refreshed_portfolio_at" TIMESTAMP, "referred_domain_url" text NOT NULL DEFAULT 'awaken.tax', "last_edited_at" TIMESTAMP, "last_started_recalculate_at" TIMESTAMP, "started_rewriting_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "last_synced_at" TIMESTAMP, CONSTRAINT "UQ_9fc64635d86bd8e4c6d2576aa7e" UNIQUE ("referral_code"), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "clients_created_by_id_idx" ON "clients" ("created_by_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "clients_referral_code_idx" ON "clients" ("referral_code") `
        );
        await queryRunner.query(
            `CREATE INDEX "clients_has_sent_account_reminder_idx" ON "clients" ("has_sent_account_reminder") `
        );
        await queryRunner.query(
            `CREATE INDEX "clients_needs_recalculate_idx" ON "clients" ("needs_recalculate") `
        );
        await queryRunner.query(
            `CREATE INDEX "clients_created_at_idx" ON "clients" ("created_at") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."permission_level_enum" AS ENUM('read', 'write')`
        );
        await queryRunner.query(
            `CREATE TABLE "client_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idempotency" text NOT NULL, "client_id" uuid NOT NULL, "pending_user_id" uuid, "user_id" uuid, "permission_level" "public"."permission_level_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_d3df629b1ca0b91eb9adbe0af52" UNIQUE ("idempotency"), CONSTRAINT "PK_b22de4c97dfca491640f1eec014" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "client_permission_client_idx" ON "client_permissions" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "client_permission_pending_user_id_idx" ON "client_permissions" ("pending_user_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "client_permission_user_id_idx" ON "client_permissions" ("user_id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."account_import_type_enum" AS ENUM('hatchfi', 'vezgo', 'plaid', 'address', 'oauth_token', 'virtual_account', 'manual', 'awaken_csv_file_upload', 'file_upload')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."account_integration_status_enum" AS ENUM('out_of_date', 'current')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."account_status_enum" AS ENUM('connected', 'disconnected', 'syncing', 'synced', 'failed', 'none', 'queued')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."account_type_enum" AS ENUM('exchange', 'wallet', 'none')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."wallet_provider_enum" AS ENUM('phantom', 'awaken')`
        );
        await queryRunner.query(
            `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text NOT NULL, "import_type" "public"."account_import_type_enum" NOT NULL DEFAULT 'address', "integration_status" "public"."account_integration_status_enum" NOT NULL DEFAULT 'current', "integration_out_of_date_message" text, "hatchfi_id" text, "vezgo_id" text, "plaid_access_token" text, "plaid_next_cursor" text, "file_type" text, "file_object_key" text, "is_large_account" boolean, "start_date" TIMESTAMP, "end_date" TIMESTAMP, "icon_image_url" text NOT NULL, "failed_reason" text, "status" "public"."account_status_enum" NOT NULL, "last_synced_at" TIMESTAMP, "source" text NOT NULL, "type" "public"."account_type_enum" NOT NULL, "is_active" boolean NOT NULL, "has_done_initial_sync" boolean NOT NULL DEFAULT true, "include_staking_rewards" boolean NOT NULL DEFAULT true, "can_auto_retry_sync" boolean NOT NULL DEFAULT true, "reference_id" text NOT NULL, "wallet_address" text, "coinbase_metadata" text, "number_of_transactions" numeric, "access_token" text, "refresh_access_token" text, "token_expires_at" TIMESTAMP, "is_wallet_connected" boolean NOT NULL DEFAULT false, "wallet_provider" "public"."wallet_provider_enum", "wallet_session" text, "wallet_dapp_public_key" text, "wallet_dapp_phantom_public_key" text, "wallet_dapp_private_key" text, "user_id" uuid NOT NULL, "idempotency" character varying NOT NULL, "client_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_e9a06395f334f9335794fa21ba1" UNIQUE ("idempotency"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "account_status_idx" ON "accounts" ("status") `
        );
        await queryRunner.query(
            `CREATE INDEX "account_wallet_address_idx" ON "accounts" ("wallet_address") `
        );
        await queryRunner.query(
            `CREATE INDEX "account_user_id_idx" ON "accounts" ("user_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "account_client_id_idx" ON "accounts" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "account_created_at_index" ON "accounts" ("created_at") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."asset_type_enum" AS ENUM('fungible_token', 'nft', 'fiat_currency')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."asset_taxation_type_enum" AS ENUM('property', 'currency')`
        );
        await queryRunner.query(
            `CREATE TABLE "assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "collection_name" text, "decimals" smallint, "symbol" text, "description" text, "type" "public"."asset_type_enum" NOT NULL, "standard" text, "taxation_type" "public"."asset_taxation_type_enum", "provider" text NOT NULL, "thumbnail_image_url" text, "image_url" text, "icon_image_url" text, "metadata_url" text, "identifier" text, "contract_address" text, "token_id" text, "data_provider" text, "idempotency" text NOT NULL, "coin_gecko_token_id" text, "current_total_cost_basis" numeric, "current_amount" numeric, "client_id" uuid NOT NULL, "is_spam_auto" boolean NOT NULL DEFAULT false, "is_spam_user_set" boolean NOT NULL DEFAULT false, "is_worthless" boolean NOT NULL DEFAULT false, "is_hidden" boolean NOT NULL DEFAULT false, "use_awaken_price" boolean NOT NULL DEFAULT false, "override_current_value" numeric, "simplehash_collection_id" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_995000c750402026aae8de51b75" UNIQUE ("idempotency"), CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "asset_identifier_idx" ON "assets" ("identifier") `
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_81e40bd96294e1c1499c98bae3" ON "assets" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "assets_provider_contract_address_idx" ON "assets" ("provider", "contract_address") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."default_rule_label_from" AS ENUM('wallet_labels', 'manual', 'brianleect')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."default_rule_confidence" AS ENUM('not_confident', 'unconfident', 'confident', 'certain')`
        );
        await queryRunner.query(
            `CREATE TABLE "default_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" text NOT NULL, "type" text NOT NULL DEFAULT '', "label" text NOT NULL DEFAULT '', "default_rule_label_from" "public"."default_rule_label_from" NOT NULL DEFAULT 'manual', "constraints" jsonb NOT NULL, "idempotency" text NOT NULL, "example_txn_hash" text NOT NULL DEFAULT '', "function_name" text, "default_rule_confidence" "public"."default_rule_confidence" NOT NULL DEFAULT 'certain', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_121085d4176f492a3bf0581ad46" UNIQUE ("idempotency"), CONSTRAINT "PK_36423258b73612be6e96723d51d" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."rule_type_enum" AS ENUM('v1:add_liquidity', 'v1:remove_liquidity', 'v1:lend_swap', 'v1:lend_borrow', 'v1:lend', 'v1:withdraw', 'v1:withdraw_swap', 'v1:borrow', 'v1:repay_withdraw', 'v1:repay', 'v1:staking', 'v1:staking_swap', 'v1:unstaking_swap', 'v1:unstaking_with_rewards', 'v1:unstaking_without_rewards', 'v1:nft_buy__1', 'v1:nft_sell__1', 'v1:nft_swap', 'v1:swap__1', 'v1:airdrop', 'v1:nft_list__1', 'v1:claim_rewards', 'v1:donation', 'v1:gift', 'v1:internal_transfer', 'v1:external_transfer', 'v1:income', 'v1:rewards_income', 'v1:mining_income', 'v1:non_taxable', 'v1:spam', 'v1:receive', 'v1:payment', 'v1:coin_sell__1', 'v1:coin_buy', 'v1:wrapping', 'v1:bridging', 'v1:fee_expense_deduction', 'v1:capital_gain', 'v1:open_position', 'v1:close_position', 'v1:save_for_later')`
        );
        await queryRunner.query(
            `CREATE TABLE "rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" text NOT NULL, "type" "public"."rule_type_enum" NOT NULL, "label" text NOT NULL DEFAULT '', "constraints" jsonb NOT NULL, "idempotency" text NOT NULL, "example_txn_hash" text NOT NULL DEFAULT '', "created_by_awaken" boolean NOT NULL DEFAULT false, "client_id" uuid, "function_name" text, "confidence" "public"."default_rule_confidence" NOT NULL DEFAULT 'certain', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_192dd40aeeaa4071a92dcc7b2d4" UNIQUE ("idempotency"), CONSTRAINT "PK_10fef696a7d61140361b1b23608" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "rules_client_id_index" ON "rules" ("client_id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."transfer_entity_type_enum" AS ENUM('account_id', 'address')`
        );
        await queryRunner.query(
            `CREATE TABLE "transfers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dedupe_unique_id" text, "type" text, "from_type" "public"."transfer_entity_type_enum", "from_address" text, "original_from_address" text, "from_account_id" uuid, "to_type" "public"."transfer_entity_type_enum", "to_address" text, "original_to_address" text, "to_account_id" uuid, "raw_asset" jsonb, "asset_identifier" text, "position" integer, "asset_id" uuid, "amount" numeric, "original_amount" numeric, "original_fiat_value" numeric, "override_fiat_value" numeric, "override_basis_fiat_value" numeric, "is_user_set_basis_fiat_value" boolean NOT NULL DEFAULT false, "is_user_set_fiat_value" boolean NOT NULL DEFAULT false, "is_user_set_amount" boolean NOT NULL DEFAULT false, "is_created_by_user" boolean NOT NULL DEFAULT false, "fiat_currency" text, "provider" text NOT NULL, "contract_address" text, "is_hidden" boolean NOT NULL DEFAULT false, "is_solana_rent" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "added_at" TIMESTAMP, "client_id" uuid NOT NULL, "transaction_id" uuid NOT NULL, CONSTRAINT "UQ_54dc8b951b8bcdc1deed3442618" UNIQUE ("dedupe_unique_id", "transaction_id"), CONSTRAINT "PK_f712e908b465e0085b4408cabc3" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "transfers_asset_identifier_idx" ON "transfers" ("asset_identifier") `
        );
        await queryRunner.query(
            `CREATE INDEX "transfers_created_at_idx" ON "transfers" ("created_at") `
        );
        await queryRunner.query(
            `CREATE INDEX "transfers_client_id_idx" ON "transfers" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "transfers_transaction_id_idx" ON "transfers" ("transaction_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "transfers_to_account_client_idx" ON "transfers" ("to_account_id", "client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "transfers_from_account_client_idx" ON "transfers" ("from_account_id", "client_id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."ledger_transaction_type_enum" AS ENUM('transfer', 'buy', 'sell', 'unknown')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."ledger_transaction_status_enum" AS ENUM('pending', 'failed', 'canceled', 'completed', 'unknown')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."ledger_transaction_reviewed_status_enum" AS ENUM('reviewed', 'needs_review')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."is_dirty_enum" AS ENUM('clean', 'dirty', 'recalculate')`
        );
        await queryRunner.query(
            `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "insertion_id" text NOT NULL, "notes" text, "internal_notes" text NOT NULL DEFAULT '', "type" "public"."ledger_transaction_type_enum" DEFAULT 'unknown', "label" text, "rule_used_id" uuid, "auto_review_reason" text, "hatchfi_transaction_type" text, "hatchfi_transaction_id" text, "vezgo_transaction_type" text, "vezgo_transaction_id" text, "status" "public"."ledger_transaction_status_enum" NOT NULL, "title" text, "description" text, "fiat_currency" text NOT NULL DEFAULT 'USD', "review_status" "public"."ledger_transaction_reviewed_status_enum" NOT NULL DEFAULT 'needs_review', "needs_review" jsonb, "paid_txn_fee" boolean, "txn_fee_fiat_value" numeric, "txn_fee_fiat_currency" text, "txn_fee_amount" numeric, "txn_fee_cryptocurrency" text, "txn_fee_cryptocurrency_coin_gecko_id" text, "price_cents" integer NOT NULL, "cryptocurrency" text, "provider" text NOT NULL, "idempotency" text NOT NULL, "entries_sum" bigint, "cap_gains_sum" bigint, "cap_gains_sum_signed" text NOT NULL DEFAULT '', "income_sum" bigint, "is_missing_basis" boolean NOT NULL DEFAULT false, "data_function_name" text, "data_method_id" text, "data_type" text, "data_info_receipt_to" text, "data_from" text, "data_info_metadata_input" text, "data_solana_instructions" jsonb, "data_fee_payer" text, "data_reward_info" text, "data_source" text, "data_operation" text, "data_transfer_type" text, "data_solana_txn_type" text, "data_transfers_nft_sale_type" text, "data_transfers_nft_amount" numeric, "txn_hash" text, "from_reference_id" text NOT NULL, "has_processed" boolean NOT NULL DEFAULT true, "manual" boolean NOT NULL DEFAULT false, "is_spam" boolean NOT NULL DEFAULT false, "user_id" uuid NOT NULL, "client_id" uuid NOT NULL, "source_account_id" character varying, "is_dirty" "public"."is_dirty_enum" NOT NULL DEFAULT 'dirty', "is_importing" boolean NOT NULL DEFAULT false, "constraints" jsonb, "function_name" text, "last_modified_by_id" uuid, "processor_reviewed" TIMESTAMP, "created_at" TIMESTAMP NOT NULL, "added_at" TIMESTAMP, "recalculated_at" TIMESTAMP, CONSTRAINT "unique_txn_for_provider" UNIQUE ("idempotency", "provider"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_transactions_insertion_idx" ON "transactions" ("insertion_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "transactions_label_idx" ON "transactions" ("label") `
        );
        await queryRunner.query(
            `CREATE INDEX "transactions_rule_used_id_idx" ON "transactions" ("rule_used_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_transactions_data_operation_idx" ON "transactions" ("data_operation") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_transactions_txn_hash_idx" ON "transactions" ("txn_hash") `
        );
        await queryRunner.query(
            `CREATE INDEX "transactions_user_id_idx" ON "transactions" ("user_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_transactions_client_id_idx" ON "transactions" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_transactions_source_account_id_idx" ON "transactions" ("source_account_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "transactions_is_dirty_idx" ON "transactions" ("is_dirty") `
        );
        await queryRunner.query(
            `CREATE INDEX "transactions_constraints_idx" ON "transactions" ("constraints") `
        );
        await queryRunner.query(
            `CREATE INDEX "transactions_last_modified_by_id_idx" ON "transactions" ("last_modified_by_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "transactions_processor_reviewed_idx" ON "transactions" ("processor_reviewed") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_transactions_created_at_idx" ON "transactions" ("created_at") `
        );
        await queryRunner.query(
            `CREATE INDEX "transactions_is_importing_client_id_idx" ON "transactions" ("is_importing", "client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "txn_client_is_dirty_idx" ON "transactions" ("is_dirty", "client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "txn_filter_composite_idx" ON "transactions" ("is_importing", "processor_reviewed", "status", "is_dirty") `
        );
        await queryRunner.query(
            `CREATE TABLE "fees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dedupe_unique_id" text, "type" text NOT NULL DEFAULT 'transaction_fee', "paid_txn_fee" boolean NOT NULL, "is_withheld_fee" boolean NOT NULL, "amount" numeric, "override_fiat_value" numeric, "fiat_currency" text, "original_fiat_value" numeric, "raw_asset" jsonb, "asset_identifier" text, "asset_id" uuid, "payer_reference_id" text, "payer_account_id" uuid, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "added_at" TIMESTAMP, "client_id" uuid NOT NULL, "transaction_id" uuid NOT NULL, CONSTRAINT "UQ_acac7d1406cf503f0dddc14e212" UNIQUE ("dedupe_unique_id", "transaction_id"), CONSTRAINT "PK_97f3a1b1b8ee5674fd4da93f461" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "fees_asset_identifier_idx" ON "fees" ("asset_identifier") `
        );
        await queryRunner.query(
            `CREATE INDEX "fees_asset_id_idx" ON "fees" ("asset_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "fees_payer_account_id_idx" ON "fees" ("payer_account_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "fees_created_at_idx" ON "fees" ("created_at") `
        );
        await queryRunner.query(
            `CREATE INDEX "fees_client_id_idx" ON "fees" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "fees_transaction_id_idx" ON "fees" ("transaction_id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."ledger_account_classification_enum" AS ENUM('revenue', 'expense', 'asset', 'liability', 'equity')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."ledger_account_type_enum" AS ENUM('current_asset', 'fixed_asset', 'accounts_receivable', 'other_asset', 'equity', 'expense', 'reward_expense', 'other_expense', 'cost_of_goods_sold', 'operation_expense', 'accounts_payable', 'long_term_liability', 'other_liability', 'income', 'other_income', 'unknown')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."ledger_account_account_sub_type_enum" AS ENUM('other_current_assets', 'cash_assets', 'investments', 'un_categorized_assets', 'accounts_receivable', 'nft_asset', 'coin_asset', 'funds', 'owners_equity', 'partner_contributions', 'contributions', 'unknown_contributions', 'distributions', 'peer_to_peer_distributions', 'bridging_contributions', 'bridging_distributions', 'cancellation_fee', 'transferless_gas_fees', 'transfer_fees', 'futures_fees', 'futures_position_expenses', 'bridging_fees', 'income_expense_fees', 'failed_transaction_fee', 'fee_expense_deduction', 'approval_fee', 'swapping_fee', 'protocol_fee', 'airdrop_fees', 'other_fees', 'donations', 'gifts', 'donation_fees', 'scams_or_fraud', 'loan_expense_fees', 'current_liabilities', 'accounts_payable', 'loan_payable', 'loan_liabilities', 'default', 'staking_income', 'sales', 'futures_proceeds', 'derivatives_proceeds', 'un_categorized_income', 'airdrop_income', 'interest_income', 'rewards_income', 'service_income', 'mining_income', 'unknown', 'error')`
        );
        await queryRunner.query(
            `CREATE TABLE "ledger_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "classification" "public"."ledger_account_classification_enum" NOT NULL, "account_type" "public"."ledger_account_type_enum" NOT NULL DEFAULT 'unknown', "account_sub_type" "public"."ledger_account_account_sub_type_enum" DEFAULT 'unknown', "slug" text NOT NULL, "idempotency" text NOT NULL, "is_archived" boolean NOT NULL, "mpath" character varying DEFAULT '', "level" integer NOT NULL, "parent_id" uuid, "created_by_id" uuid NOT NULL, "client_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_54060faa1b1bd9bc2542dff8f03" UNIQUE ("idempotency"), CONSTRAINT "PK_62b34396dda564757cf123fff0e" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_a159217b9e9773cfcdc98c0176" ON "ledger_accounts" ("name") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_account_parent_id_idx" ON "ledger_accounts" ("parent_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_account_created_by_id_idx" ON "ledger_accounts" ("created_by_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_account_client_id_idx" ON "ledger_accounts" ("client_id", "parent_id") `
        );
        await queryRunner.query(
            `CREATE TABLE "ledger_entry_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fiat_currency" text NOT NULL DEFAULT 'USD', "fiat_amount_used" numeric NOT NULL, "type" text NOT NULL DEFAULT 'edge', "crypto_amount_used" numeric, "from_entry_id" uuid NOT NULL, "to_entry_id" uuid, "to_transaction_id" uuid, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "client_id" uuid NOT NULL, CONSTRAINT "PK_43f754efbe234347cbe20eb73f7" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_entry_link_from_entry_idx" ON "ledger_entry_links" ("from_entry_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_entry_link_to_entry_idx" ON "ledger_entry_links" ("to_entry_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_entry_link_to_txn_idx" ON "ledger_entry_links" ("to_transaction_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_e73ff8f78a145ef938715dd0dc" ON "ledger_entry_links" ("client_id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."ledger_entry_direction_enum" AS ENUM('debit', 'credit')`
        );
        await queryRunner.query(
            `CREATE TABLE "ledger_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "insertion_id" text NOT NULL, "notes" text, "direction" "public"."ledger_entry_direction_enum" NOT NULL, "original_amount" numeric NOT NULL, "amount" numeric NOT NULL, "has_known_price" boolean, "original_fiat_amount" numeric NOT NULL, "fiat_amount" numeric NOT NULL, "fiat_currency" text NOT NULL, "related_transfer_id" text, "related_fee_id" text, "transaction_id" uuid NOT NULL, "account_id" uuid NOT NULL, "client_id" uuid NOT NULL, "asset_id" uuid, "ledger_account_id" uuid, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "added_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_6efcb84411d3f08b08450ae75d5" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_entries_related_transfer_id_idx" ON "ledger_entries" ("related_transfer_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_entries_related_fee_id_idx" ON "ledger_entries" ("related_fee_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_entries_transaction_id_idx" ON "ledger_entries" ("transaction_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_entry_account_idx" ON "ledger_entries" ("account_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_4eb27330309c1f097ec0fd9562" ON "ledger_entries" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_entry_asset_idx" ON "ledger_entries" ("asset_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_entry_ledger_account_idx" ON "ledger_entries" ("ledger_account_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "ledger_entries_created_at_idx" ON "ledger_entries" ("created_at") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."filter_form_client_type" AS ENUM('individual', 'business')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."filter_form_chains_type" AS ENUM('ETH', 'ETHL2', 'OTHER')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."filter_form_num_txns_type" AS ENUM('Low', 'LowMid', 'Mid', 'MidHigh', 'High', '1', '2', '3', '4', '5')`
        );
        await queryRunner.query(
            `CREATE TABLE "filter_form_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_type" "public"."filter_form_client_type" NOT NULL, "chains_type" "public"."filter_form_chains_type" NOT NULL, "num_txns" "public"."filter_form_num_txns_type" NOT NULL, "name" text NOT NULL, "email" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_28b0a843a4e0c0d98255a45fe39" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."filter_form_cpas_num_txns_lower_bound_enum" AS ENUM('Low', 'LowMid', 'Mid', 'MidHigh', 'High', '1', '2', '3', '4', '5')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."filter_form_cpas_num_txns_upper_bound_enum" AS ENUM('Low', 'LowMid', 'Mid', 'MidHigh', 'High', '1', '2', '3', '4', '5')`
        );
        await queryRunner.query(
            `CREATE TABLE "filter_form_cpas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "is_accepting_individuals" boolean NOT NULL, "is_accepting_businesses" boolean NOT NULL, "is_accepting_eth" boolean NOT NULL, "is_accepting_eth_l2" boolean NOT NULL, "is_accepting_other_chains" boolean NOT NULL, "num_txns_lower_bound" "public"."filter_form_cpas_num_txns_lower_bound_enum" NOT NULL, "num_txns_upper_bound" "public"."filter_form_cpas_num_txns_upper_bound_enum" NOT NULL, "img_url" text NOT NULL, "name" text NOT NULL, "email" text NOT NULL, "twitter" text NOT NULL, "linkedin" text NOT NULL, "headline" text NOT NULL, "description" text NOT NULL, "confirmed" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dad7d61380b9b84172ddfc3ac9f" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "portfolio_waitlist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "referral_code" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_060fee53bdaebabb126d379bdb7" UNIQUE ("email"), CONSTRAINT "PK_4f42470169a2d4e3274dc1468f8" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "waitlist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" text NOT NULL, "user_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_973cfbedc6381485681d6a6916c" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "waitlist_user_id_idx" ON "waitlist" ("user_id") `
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "waitlist_user_type_idx" ON "waitlist" ("user_id", "type") `
        );
        await queryRunner.query(
            `CREATE TABLE "whitelist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "email" text NOT NULL, "can_onboard" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_676adbd0f42f454f3aa85cb8490" UNIQUE ("email"), CONSTRAINT "PK_0169bfbd49b0511243f7a068cec" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."job_type_enum" AS ENUM('transaction_import', 'rerun_graph')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."job_messaging_infra_enum" AS ENUM('bull_queue', 'inngest')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."job_status_enum" AS ENUM('completed', 'in_progress', 'queued', 'failed', 'canceled')`
        );
        await queryRunner.query(
            `CREATE TABLE "jobs" ("job_id" text NOT NULL, "type" "public"."job_type_enum" NOT NULL, "infra" "public"."job_messaging_infra_enum" NOT NULL, "status" "public"."job_status_enum" NOT NULL, "failed_reason" text, "number_of_transactions" numeric NOT NULL DEFAULT '0', "progress" numeric NOT NULL DEFAULT '0', "processed" numeric DEFAULT '0', "total" numeric DEFAULT '0', "import_file_object_key" text, "inngest_run_id" text, "log_file_data" jsonb, "completed_at" TIMESTAMP, "failed_at" TIMESTAMP, "client_id" uuid NOT NULL, "account_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "events" json NOT NULL DEFAULT '[]', CONSTRAINT "PK_75f2e130e4b1372fea0b6248a17" PRIMARY KEY ("job_id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_75f2e130e4b1372fea0b6248a1" ON "jobs" ("job_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "jobs_inngest_run_id_idx" ON "jobs" ("inngest_run_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "jobs_client_id_idx" ON "jobs" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "jobs_account_id_idx" ON "jobs" ("account_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "jobs_created_at_idx" ON "jobs" ("created_at") `
        );
        await queryRunner.query(
            `CREATE TABLE "recalculate_summaries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_id" uuid NOT NULL, "snapshot_path" text NOT NULL, "breakdowns" jsonb NOT NULL, "used_speedup" boolean NOT NULL DEFAULT false, "job_id" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_83a935e29656182829ec3db06d" UNIQUE ("job_id"), CONSTRAINT "PK_50701889470a76e38104d84f820" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "recalculate_summaries_client_id_idx" ON "recalculate_summaries" ("client_id") `
        );
        await queryRunner.query(
            `CREATE TABLE "referrals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "referred_by_can_claim" boolean NOT NULL DEFAULT false, "referred_by_has_claimed" boolean NOT NULL DEFAULT false, "referred_by_num_txns_free" numeric, "referred_by_free_credit_cents" numeric, "referred_client_id" uuid NOT NULL, "referred_by_client_id" uuid NOT NULL, "referred_user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "referrals_pair_unique_idx" UNIQUE ("referred_by_client_id", "referred_user_id"), CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "referrals_referred_client_id_idx" ON "referrals" ("referred_client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "referrals_referred_by_client_id_idx" ON "referrals" ("referred_by_client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "referrals_referred_user_id_idx" ON "referrals" ("referred_user_id") `
        );
        await queryRunner.query(
            `CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" text NOT NULL, "title" text NOT NULL, "currency" text NOT NULL DEFAULT 'USD', "file_object_key" text NOT NULL, "cost_basis_algorithm" "public"."cost_basis_algorithm_enum" NOT NULL DEFAULT 'fifo', "start_date" TIMESTAMP, "end_date" TIMESTAMP, "client_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "reports_client_id_index" ON "reports" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "reports_created_at_index" ON "reports" ("created_at") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."subscription_upgrade_type" AS ENUM('unlimited_cx')`
        );
        await queryRunner.query(
            `CREATE TABLE "subscription_upgrades" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."subscription_upgrade_type", "stripe_payment_intent_id" text, "tax_year" numeric NOT NULL, "subtotal_cents" numeric NOT NULL, "credit_used" numeric NOT NULL, "total_cents" numeric NOT NULL, "subscription_id" uuid NOT NULL, "client_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_0db81faf3bf90b44dda3a97f467" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "subscription_upgrades_subscription_id_index" ON "subscription_upgrades" ("subscription_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "subscription_upgrades_client_id_index" ON "subscription_upgrades" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "subscription_upgrades_created_at_index" ON "subscription_upgrades" ("created_at") `
        );
        await queryRunner.query(
            `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "stripe_payment_intent_id" text, "subtotal_cents" numeric NOT NULL, "upgrade_total_cents" numeric NOT NULL DEFAULT '0', "credit_used" numeric NOT NULL, "spam_discount_used" numeric NOT NULL DEFAULT '0', "total_cents" numeric NOT NULL, "transaction_ceiling" numeric NOT NULL, "tax_year" numeric NOT NULL, "country" text NOT NULL DEFAULT 'US', "start_period" TIMESTAMP, "end_period" TIMESTAMP, "is_free_subscription" boolean NOT NULL DEFAULT false, "period_transaction_count" numeric, "notes" text, "idempotency" text NOT NULL, "client_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_9156c52ca88249c21863b613054" UNIQUE ("idempotency"), CONSTRAINT "client_year_uniq_idx" UNIQUE ("client_id", "tax_year"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "subscriptions_client_id_index" ON "subscriptions" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "subscriptions_created_at_index" ON "subscriptions" ("created_at") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."spam_asset_created_by_enum" AS ENUM('admin_dashboard', 'alchemy_api', 'algorithm')`
        );
        await queryRunner.query(
            `CREATE TABLE "spam_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contract_address" text NOT NULL, "provider" text NOT NULL, "idempotency" text NOT NULL, "example_txn_hash" text NOT NULL DEFAULT '', "asset_name" text NOT NULL DEFAULT '', "created_by" "public"."spam_asset_created_by_enum" NOT NULL, "is_spam" boolean, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_e35efcbf8ea416bef6842ca0080" UNIQUE ("idempotency"), CONSTRAINT "PK_9f32ee8a00b1ed803fa0df374f3" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "spam_assets_contract_address_idx" ON "spam_assets" ("contract_address") `
        );
        await queryRunner.query(
            `CREATE INDEX "spam_assets_provider_idx" ON "spam_assets" ("provider") `
        );
        await queryRunner.query(
            `CREATE INDEX "spam_assets_idempotency_idx" ON "spam_assets" ("idempotency") `
        );
        await queryRunner.query(
            `CREATE INDEX "spam_assets_is_spam_idx" ON "spam_assets" ("is_spam") `
        );
        await queryRunner.query(
            `CREATE INDEX "spam_assets_contract_address_provider_idx" ON "spam_assets" ("contract_address", "provider") `
        );
        await queryRunner.query(
            `CREATE TABLE "asset_holdings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" text, "amount" numeric NOT NULL, "asset_id" uuid, "client_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f01170a188aa42f47f75aa04ec9" UNIQUE ("asset_id"), CONSTRAINT "UQ_1271350fd4813acf628ec922eb6" UNIQUE ("client_id"), CONSTRAINT "PK_efa5745663a863ea26373875108" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "asset_holdings_asset_id_idx" ON "asset_holdings" ("asset_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "asset_holdings_client_id_idx" ON "asset_holdings" ("client_id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."trading_provider_enum" AS ENUM('jupiter')`
        );
        await queryRunner.query(
            `CREATE TABLE "quotes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" "public"."trading_provider_enum", "chain" text NOT NULL, "send_symbol" text NOT NULL, "send_asset_key" text NOT NULL, "send_icon_image_url" text NOT NULL, "receive_symbol" text NOT NULL, "receive_asset_key" text NOT NULL, "receive_icon_image_url" text NOT NULL, "send_amount" numeric NOT NULL, "receive_amount" numeric NOT NULL, "send_fiat_amount_cents" numeric NOT NULL, "receive_fiat_amount_cents" numeric NOT NULL, "send_fiat_currency" text NOT NULL, "receive_fiat_currency" text NOT NULL, "estimated_swap_fiat_amount" numeric NOT NULL, "data" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "client_id" uuid NOT NULL, "account_id" uuid NOT NULL, CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "quotes_client_idx" ON "quotes" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "quotes_account_idx" ON "quotes" ("account_id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."swap_status_enum" AS ENUM('pending', 'confirmed', 'failed')`
        );
        await queryRunner.query(
            `CREATE TABLE "swaps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" "public"."trading_provider_enum", "chain" text NOT NULL, "send_symbol" text NOT NULL, "send_asset_key" text NOT NULL, "receive_symbol" text NOT NULL, "receive_asset_key" text NOT NULL, "send_amount" numeric NOT NULL, "receive_amount" numeric NOT NULL, "status" "public"."swap_status_enum" NOT NULL, "hash" text NOT NULL, "estimated_swap_fiat_amount" numeric NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "client_id" uuid NOT NULL, "quote_id" uuid NOT NULL, "account_id" uuid NOT NULL, CONSTRAINT "swaps_hash_chain_idx" UNIQUE ("hash", "chain"), CONSTRAINT "PK_4297e409c8f0be9cb39d520be2b" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "swaps_client_idx" ON "swaps" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "swaps_quote_idx" ON "swaps" ("quote_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "swaps_account_idx" ON "swaps" ("account_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "swaps_send_asset_key_chain_idx" ON "swaps" ("send_asset_key", "chain") `
        );
        await queryRunner.query(
            `CREATE INDEX "swaps_receive_asset_key_chain_idx" ON "swaps" ("receive_asset_key", "chain") `
        );
        await queryRunner.query(
            `CREATE TABLE "tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" text NOT NULL, "symbol" text NOT NULL, "name" text NOT NULL, "coingecko_id" text, "contract_address" text NOT NULL, "type" text NOT NULL, "decimals" bigint NOT NULL, "asset_key" text NOT NULL, "icon_image_url" text NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "token_provider_idx" ON "tokens" ("provider") `
        );
        await queryRunner.query(
            `CREATE INDEX "token_coingecko_id_idx" ON "tokens" ("coingecko_id") `
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "token_coingecko_id_provider_idx" ON "tokens" ("coingecko_id", "provider") `
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "token_contract_address_provider_idx" ON "tokens" ("contract_address", "provider") `
        );
        await queryRunner.query(
            `ALTER TABLE "packs" ADD CONSTRAINT "FK_40241c13f4cf8da5dc6b68f5f12" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_ae39047bdb0e675ea2d6b60fa6b" FOREIGN KEY ("active_client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "clients" ADD CONSTRAINT "FK_d2ac1947399a642a52f7eb50794" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "client_permissions" ADD CONSTRAINT "FK_12b76f3c2fe888ab31b28fbd01b" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "client_permissions" ADD CONSTRAINT "FK_b192ffdf1aa254ed87f0b195b4e" FOREIGN KEY ("pending_user_id") REFERENCES "pending_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "client_permissions" ADD CONSTRAINT "FK_6dbe174b8f59285dad3d41b10ef" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD CONSTRAINT "FK_3000dad1da61b29953f07476324" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD CONSTRAINT "FK_099611aae88727aaa8369983f02" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "assets" ADD CONSTRAINT "FK_81e40bd96294e1c1499c98bae32" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "rules" ADD CONSTRAINT "FK_95563713ab3f82a634c322feb46" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD CONSTRAINT "FK_9249ca69c046f687f06bafa43bb" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD CONSTRAINT "FK_6a909992251fdc3b8f0ee840eb3" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD CONSTRAINT "FK_808f8b7c80560cda3ccdaa03ec2" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_ebb352c973d8a85e8779a15ff35" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_20b776861f98d0ceb3b7ac1154b" FOREIGN KEY ("rule_used_id") REFERENCES "rules"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_90ba714dfe6d827238014e85131" FOREIGN KEY ("last_modified_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "fees" ADD CONSTRAINT "FK_0606897afef3f9a6323ccc2356a" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "fees" ADD CONSTRAINT "FK_5de475355637bedc8b3ca9af80f" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "fees" ADD CONSTRAINT "FK_77147d0c22edbeb1fe835a68f61" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "fees" ADD CONSTRAINT "FK_7d479d297c94c3a708d079a3651" FOREIGN KEY ("payer_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_accounts" ADD CONSTRAINT "FK_b0cc8476c75f7967bafbc9c7c37" FOREIGN KEY ("parent_id") REFERENCES "ledger_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_accounts" ADD CONSTRAINT "FK_c5ce2951b988be62e41b1292ea3" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_accounts" ADD CONSTRAINT "FK_14336f45ba851c98642a6f8d78d" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entry_links" ADD CONSTRAINT "FK_c1e019ba7b00b9e7213ff85836b" FOREIGN KEY ("from_entry_id") REFERENCES "ledger_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entry_links" ADD CONSTRAINT "FK_639856bac9f93cfc76abcec3b36" FOREIGN KEY ("to_entry_id") REFERENCES "ledger_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entry_links" ADD CONSTRAINT "FK_65769547f2518efda8483f9d800" FOREIGN KEY ("to_transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entry_links" ADD CONSTRAINT "FK_e73ff8f78a145ef938715dd0dc6" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_b26c5ef5853fd6e0a8680427f60" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_e4440167e470be69f9622c1ceab" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_4eb27330309c1f097ec0fd9562e" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_eaf6f8d76dcc681a790e31b0921" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_827f3a9861711976024144e27c7" FOREIGN KEY ("ledger_account_id") REFERENCES "ledger_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist" ADD CONSTRAINT "FK_338590951b5bdafd304299dfb08" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "jobs" ADD CONSTRAINT "FK_dec6205e2cd13841763710f9892" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "jobs" ADD CONSTRAINT "FK_ba0408cba0e00d16a4e9a0326ce" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "recalculate_summaries" ADD CONSTRAINT "FK_ed7d53514c28997f614a3877c3b" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "recalculate_summaries" ADD CONSTRAINT "FK_83a935e29656182829ec3db06d2" FOREIGN KEY ("job_id") REFERENCES "jobs"("job_id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_b0498befe59696fdf37f4187186" FOREIGN KEY ("referred_by_client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_cd111cf4e48d07ecbed11e995ee" FOREIGN KEY ("referred_client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "reports" ADD CONSTRAINT "FK_bda44e16992191ff11ad8da01e2" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "subscription_upgrades" ADD CONSTRAINT "FK_a3131b34d2b70536fa0db63a6d8" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "subscription_upgrades" ADD CONSTRAINT "FK_4e73a4c97f4df46bb3dc3d1a7d1" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_03f469e6b8295eace12ecaaf428" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "asset_holdings" ADD CONSTRAINT "FK_f01170a188aa42f47f75aa04ec9" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "asset_holdings" ADD CONSTRAINT "FK_1271350fd4813acf628ec922eb6" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD CONSTRAINT "FK_c7436620804208a7496ad03aff9" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD CONSTRAINT "FK_19c7b855fba3868d55da7cda812" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD CONSTRAINT "FK_32b8c6ed4689a45b16b2dfe478d" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD CONSTRAINT "FK_d2edf1bd53f8a1ba739fe060318" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD CONSTRAINT "FK_ca7853468de7e71517c919ddf59" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP CONSTRAINT "FK_ca7853468de7e71517c919ddf59"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP CONSTRAINT "FK_d2edf1bd53f8a1ba739fe060318"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP CONSTRAINT "FK_32b8c6ed4689a45b16b2dfe478d"`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP CONSTRAINT "FK_19c7b855fba3868d55da7cda812"`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP CONSTRAINT "FK_c7436620804208a7496ad03aff9"`
        );
        await queryRunner.query(
            `ALTER TABLE "asset_holdings" DROP CONSTRAINT "FK_1271350fd4813acf628ec922eb6"`
        );
        await queryRunner.query(
            `ALTER TABLE "asset_holdings" DROP CONSTRAINT "FK_f01170a188aa42f47f75aa04ec9"`
        );
        await queryRunner.query(
            `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_03f469e6b8295eace12ecaaf428"`
        );
        await queryRunner.query(
            `ALTER TABLE "subscription_upgrades" DROP CONSTRAINT "FK_4e73a4c97f4df46bb3dc3d1a7d1"`
        );
        await queryRunner.query(
            `ALTER TABLE "subscription_upgrades" DROP CONSTRAINT "FK_a3131b34d2b70536fa0db63a6d8"`
        );
        await queryRunner.query(
            `ALTER TABLE "reports" DROP CONSTRAINT "FK_bda44e16992191ff11ad8da01e2"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP CONSTRAINT "FK_cd111cf4e48d07ecbed11e995ee"`
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" DROP CONSTRAINT "FK_b0498befe59696fdf37f4187186"`
        );
        await queryRunner.query(
            `ALTER TABLE "recalculate_summaries" DROP CONSTRAINT "FK_83a935e29656182829ec3db06d2"`
        );
        await queryRunner.query(
            `ALTER TABLE "recalculate_summaries" DROP CONSTRAINT "FK_ed7d53514c28997f614a3877c3b"`
        );
        await queryRunner.query(
            `ALTER TABLE "jobs" DROP CONSTRAINT "FK_ba0408cba0e00d16a4e9a0326ce"`
        );
        await queryRunner.query(
            `ALTER TABLE "jobs" DROP CONSTRAINT "FK_dec6205e2cd13841763710f9892"`
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist" DROP CONSTRAINT "FK_338590951b5bdafd304299dfb08"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_827f3a9861711976024144e27c7"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_eaf6f8d76dcc681a790e31b0921"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_4eb27330309c1f097ec0fd9562e"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_e4440167e470be69f9622c1ceab"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_b26c5ef5853fd6e0a8680427f60"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entry_links" DROP CONSTRAINT "FK_e73ff8f78a145ef938715dd0dc6"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entry_links" DROP CONSTRAINT "FK_65769547f2518efda8483f9d800"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entry_links" DROP CONSTRAINT "FK_639856bac9f93cfc76abcec3b36"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_entry_links" DROP CONSTRAINT "FK_c1e019ba7b00b9e7213ff85836b"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_accounts" DROP CONSTRAINT "FK_14336f45ba851c98642a6f8d78d"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_accounts" DROP CONSTRAINT "FK_c5ce2951b988be62e41b1292ea3"`
        );
        await queryRunner.query(
            `ALTER TABLE "ledger_accounts" DROP CONSTRAINT "FK_b0cc8476c75f7967bafbc9c7c37"`
        );
        await queryRunner.query(
            `ALTER TABLE "fees" DROP CONSTRAINT "FK_7d479d297c94c3a708d079a3651"`
        );
        await queryRunner.query(
            `ALTER TABLE "fees" DROP CONSTRAINT "FK_77147d0c22edbeb1fe835a68f61"`
        );
        await queryRunner.query(
            `ALTER TABLE "fees" DROP CONSTRAINT "FK_5de475355637bedc8b3ca9af80f"`
        );
        await queryRunner.query(
            `ALTER TABLE "fees" DROP CONSTRAINT "FK_0606897afef3f9a6323ccc2356a"`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" DROP CONSTRAINT "FK_90ba714dfe6d827238014e85131"`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" DROP CONSTRAINT "FK_20b776861f98d0ceb3b7ac1154b"`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" DROP CONSTRAINT "FK_ebb352c973d8a85e8779a15ff35"`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP CONSTRAINT "FK_808f8b7c80560cda3ccdaa03ec2"`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP CONSTRAINT "FK_6a909992251fdc3b8f0ee840eb3"`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP CONSTRAINT "FK_9249ca69c046f687f06bafa43bb"`
        );
        await queryRunner.query(
            `ALTER TABLE "rules" DROP CONSTRAINT "FK_95563713ab3f82a634c322feb46"`
        );
        await queryRunner.query(
            `ALTER TABLE "assets" DROP CONSTRAINT "FK_81e40bd96294e1c1499c98bae32"`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" DROP CONSTRAINT "FK_099611aae88727aaa8369983f02"`
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" DROP CONSTRAINT "FK_3000dad1da61b29953f07476324"`
        );
        await queryRunner.query(
            `ALTER TABLE "client_permissions" DROP CONSTRAINT "FK_6dbe174b8f59285dad3d41b10ef"`
        );
        await queryRunner.query(
            `ALTER TABLE "client_permissions" DROP CONSTRAINT "FK_b192ffdf1aa254ed87f0b195b4e"`
        );
        await queryRunner.query(
            `ALTER TABLE "client_permissions" DROP CONSTRAINT "FK_12b76f3c2fe888ab31b28fbd01b"`
        );
        await queryRunner.query(
            `ALTER TABLE "clients" DROP CONSTRAINT "FK_d2ac1947399a642a52f7eb50794"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "FK_ae39047bdb0e675ea2d6b60fa6b"`
        );
        await queryRunner.query(
            `ALTER TABLE "packs" DROP CONSTRAINT "FK_40241c13f4cf8da5dc6b68f5f12"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."token_contract_address_provider_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."token_coingecko_id_provider_idx"`
        );
        await queryRunner.query(`DROP INDEX "public"."token_coingecko_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."token_provider_idx"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
        await queryRunner.query(
            `DROP INDEX "public"."swaps_receive_asset_key_chain_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."swaps_send_asset_key_chain_idx"`
        );
        await queryRunner.query(`DROP INDEX "public"."swaps_account_idx"`);
        await queryRunner.query(`DROP INDEX "public"."swaps_quote_idx"`);
        await queryRunner.query(`DROP INDEX "public"."swaps_client_idx"`);
        await queryRunner.query(`DROP TABLE "swaps"`);
        await queryRunner.query(`DROP TYPE "public"."swap_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."trading_provider_enum"`);
        await queryRunner.query(`DROP INDEX "public"."quotes_account_idx"`);
        await queryRunner.query(`DROP INDEX "public"."quotes_client_idx"`);
        await queryRunner.query(`DROP TABLE "quotes"`);
        await queryRunner.query(`DROP TYPE "public"."trading_provider_enum"`);
        await queryRunner.query(
            `DROP INDEX "public"."asset_holdings_client_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."asset_holdings_asset_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "asset_holdings"`);
        await queryRunner.query(
            `DROP INDEX "public"."spam_assets_contract_address_provider_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."spam_assets_is_spam_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."spam_assets_idempotency_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."spam_assets_provider_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."spam_assets_contract_address_idx"`
        );
        await queryRunner.query(`DROP TABLE "spam_assets"`);
        await queryRunner.query(
            `DROP TYPE "public"."spam_asset_created_by_enum"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."subscriptions_created_at_index"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."subscriptions_client_id_index"`
        );
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(
            `DROP INDEX "public"."subscription_upgrades_created_at_index"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."subscription_upgrades_client_id_index"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."subscription_upgrades_subscription_id_index"`
        );
        await queryRunner.query(`DROP TABLE "subscription_upgrades"`);
        await queryRunner.query(
            `DROP TYPE "public"."subscription_upgrade_type"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."reports_created_at_index"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."reports_client_id_index"`
        );
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(
            `DROP TYPE "public"."cost_basis_algorithm_enum"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."referrals_referred_user_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."referrals_referred_by_client_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."referrals_referred_client_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "referrals"`);
        await queryRunner.query(
            `DROP INDEX "public"."recalculate_summaries_client_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "recalculate_summaries"`);
        await queryRunner.query(`DROP INDEX "public"."jobs_created_at_idx"`);
        await queryRunner.query(`DROP INDEX "public"."jobs_account_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."jobs_client_id_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."jobs_inngest_run_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_75f2e130e4b1372fea0b6248a1"`
        );
        await queryRunner.query(`DROP TABLE "jobs"`);
        await queryRunner.query(`DROP TYPE "public"."job_status_enum"`);
        await queryRunner.query(
            `DROP TYPE "public"."job_messaging_infra_enum"`
        );
        await queryRunner.query(`DROP TYPE "public"."job_type_enum"`);
        await queryRunner.query(`DROP TABLE "whitelist"`);
        await queryRunner.query(`DROP INDEX "public"."waitlist_user_type_idx"`);
        await queryRunner.query(`DROP INDEX "public"."waitlist_user_id_idx"`);
        await queryRunner.query(`DROP TABLE "waitlist"`);
        await queryRunner.query(`DROP TABLE "portfolio_waitlist"`);
        await queryRunner.query(`DROP TABLE "filter_form_cpas"`);
        await queryRunner.query(
            `DROP TYPE "public"."filter_form_cpas_num_txns_upper_bound_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."filter_form_cpas_num_txns_lower_bound_enum"`
        );
        await queryRunner.query(`DROP TABLE "filter_form_submissions"`);
        await queryRunner.query(
            `DROP TYPE "public"."filter_form_num_txns_type"`
        );
        await queryRunner.query(`DROP TYPE "public"."filter_form_chains_type"`);
        await queryRunner.query(`DROP TYPE "public"."filter_form_client_type"`);
        await queryRunner.query(
            `DROP INDEX "public"."ledger_entries_created_at_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_entry_ledger_account_idx"`
        );
        await queryRunner.query(`DROP INDEX "public"."ledger_entry_asset_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_4eb27330309c1f097ec0fd9562"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_entry_account_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_entries_transaction_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_entries_related_fee_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_entries_related_transfer_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "ledger_entries"`);
        await queryRunner.query(
            `DROP TYPE "public"."ledger_entry_direction_enum"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_e73ff8f78a145ef938715dd0dc"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_entry_link_to_txn_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_entry_link_to_entry_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_entry_link_from_entry_idx"`
        );
        await queryRunner.query(`DROP TABLE "ledger_entry_links"`);
        await queryRunner.query(
            `DROP INDEX "public"."ledger_account_client_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_account_created_by_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_account_parent_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_a159217b9e9773cfcdc98c0176"`
        );
        await queryRunner.query(`DROP TABLE "ledger_accounts"`);
        await queryRunner.query(
            `DROP TYPE "public"."ledger_account_account_sub_type_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."ledger_account_type_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."ledger_account_classification_enum"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."fees_transaction_id_idx"`
        );
        await queryRunner.query(`DROP INDEX "public"."fees_client_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."fees_created_at_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."fees_payer_account_id_idx"`
        );
        await queryRunner.query(`DROP INDEX "public"."fees_asset_id_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."fees_asset_identifier_idx"`
        );
        await queryRunner.query(`DROP TABLE "fees"`);
        await queryRunner.query(
            `DROP INDEX "public"."txn_filter_composite_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."txn_client_is_dirty_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transactions_is_importing_client_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_transactions_created_at_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transactions_processor_reviewed_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transactions_last_modified_by_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transactions_constraints_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transactions_is_dirty_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_transactions_source_account_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_transactions_client_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transactions_user_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_transactions_txn_hash_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."ledger_transactions_data_operation_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transactions_rule_used_id_idx"`
        );
        await queryRunner.query(`DROP INDEX "public"."transactions_label_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."ledger_transactions_insertion_idx"`
        );
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."is_dirty_enum"`);
        await queryRunner.query(
            `DROP TYPE "public"."ledger_transaction_reviewed_status_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."ledger_transaction_status_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."ledger_transaction_type_enum"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transfers_from_account_client_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transfers_to_account_client_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transfers_transaction_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transfers_client_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transfers_created_at_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."transfers_asset_identifier_idx"`
        );
        await queryRunner.query(`DROP TABLE "transfers"`);
        await queryRunner.query(
            `DROP TYPE "public"."transfer_entity_type_enum"`
        );
        await queryRunner.query(`DROP INDEX "public"."rules_client_id_index"`);
        await queryRunner.query(`DROP TABLE "rules"`);
        await queryRunner.query(`DROP TYPE "public"."default_rule_confidence"`);
        await queryRunner.query(`DROP TYPE "public"."rule_type_enum"`);
        await queryRunner.query(`DROP TABLE "default_rules"`);
        await queryRunner.query(`DROP TYPE "public"."default_rule_confidence"`);
        await queryRunner.query(`DROP TYPE "public"."default_rule_label_from"`);
        await queryRunner.query(
            `DROP INDEX "public"."assets_provider_contract_address_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_81e40bd96294e1c1499c98bae3"`
        );
        await queryRunner.query(`DROP INDEX "public"."asset_identifier_idx"`);
        await queryRunner.query(`DROP TABLE "assets"`);
        await queryRunner.query(
            `DROP TYPE "public"."asset_taxation_type_enum"`
        );
        await queryRunner.query(`DROP TYPE "public"."asset_type_enum"`);
        await queryRunner.query(
            `DROP INDEX "public"."account_created_at_index"`
        );
        await queryRunner.query(`DROP INDEX "public"."account_client_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."account_user_id_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."account_wallet_address_idx"`
        );
        await queryRunner.query(`DROP INDEX "public"."account_status_idx"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."account_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."account_status_enum"`);
        await queryRunner.query(
            `DROP TYPE "public"."account_integration_status_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."account_import_type_enum"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."client_permission_user_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."client_permission_pending_user_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."client_permission_client_idx"`
        );
        await queryRunner.query(`DROP TABLE "client_permissions"`);
        await queryRunner.query(`DROP TYPE "public"."permission_level_enum"`);
        await queryRunner.query(`DROP INDEX "public"."clients_created_at_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."clients_needs_recalculate_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."clients_has_sent_account_reminder_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."clients_referral_code_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."clients_created_by_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(
            `DROP TYPE "public"."client_accountant_status_enum"`
        );
        await queryRunner.query(
            `DROP TYPE "public"."cost_basis_algorithm_enum"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_52d88bd887025f9814da7d2845"`
        );
        await queryRunner.query(`DROP TABLE "pending_users"`);
        await queryRunner.query(
            `DROP INDEX "public"."users_active_client_id_idx"`
        );
        await queryRunner.query(`DROP INDEX "public"."users_has_mobile_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_1c844df74e011d4b0694ad5b2c"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`
        );
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."auth_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."pack_created_at_index"`);
        await queryRunner.query(`DROP INDEX "public"."packs_client_id_index"`);
        await queryRunner.query(`DROP TABLE "packs"`);
        await queryRunner.query(
            `DROP INDEX "public"."exchange_rates_currency_code_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."exchange_rates_date_idx"`
        );
        await queryRunner.query(`DROP TABLE "exchange_rates"`);
        await queryRunner.query(`DROP TYPE "public"."currency_code_enum"`);
    }
}
