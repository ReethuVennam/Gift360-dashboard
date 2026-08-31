-- ══════════════════════════════════════════════════════════════
-- Gift360 Admin Backend — All Stored Procedures
-- Run AFTER admin_tables.sql
-- ══════════════════════════════════════════════════════════════

DELIMITER //

-- ────────────────────────────────────────────────────────────
-- 1. DASHBOARD SUMMARY
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_dashboard_summary//
CREATE PROCEDURE sp_admin_dashboard_summary(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    SELECT
        COUNT(DISTINCT o.order_id) AS total_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'PAID' THEN o.order_id END) AS paid_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'PENDING' THEN o.order_id END) AS pending_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'FAILED' THEN o.order_id END) AS failed_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'CANCELLED' THEN o.order_id END) AS cancelled_orders,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.total_amount END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.wallet_amount END), 0) AS total_wallet_used,
        COUNT(DISTINCT o.client_id) AS unique_customers,
        COUNT(DISTINCT CASE WHEN o.status = 'PAID' AND gc.coupon_id IS NOT NULL THEN goi.order_item_id END) AS vouchers_generated,
        COUNT(DISTINCT CASE WHEN o.status = 'PAID' AND gc.coupon_id IS NULL THEN goi.order_item_id END) AS vouchers_failed,
        COALESCE(SUM(o.coins_earned), 0) AS supercoins_earned,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' AND EXISTS (
            SELECT 1 FROM giftcard_order_items goi2
            JOIN giftcard_coupons gc2 ON gc2.order_item_id = goi2.order_item_id
            WHERE goi2.order_id = o.order_id
        ) THEN o.coins_redeemed ELSE 0 END), 0) AS supercoins_burnt,
        COALESCE(SUM(o.coins_refunded), 0) AS supercoins_refunded
    FROM giftcard_orders o
    LEFT JOIN giftcard_order_items goi ON goi.order_id = o.order_id
    LEFT JOIN giftcard_coupons gc ON gc.order_item_id = goi.order_item_id
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY);
END//

-- ────────────────────────────────────────────────────────────
-- 2. ORDERS LIST
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_orders_list//
CREATE PROCEDURE sp_admin_orders_list(
    IN p_from_date DATE,
    IN p_to_date DATE,
    IN p_brand_code VARCHAR(50),
    IN p_voucher_status VARCHAR(20),
    IN p_payment_method VARCHAR(20),
    IN p_search VARCHAR(255),
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT p_page * p_size;

    SELECT
        o.order_id, o.order_number, o.client_id,
        cp.client_name, cp.client_email, cp.client_mobile,
        o.total_amount, o.status AS order_status,
        o.created_at, o.paid_at,
        o.wallet_used, o.wallet_amount,
        o.payment_method,
        o.coins_earned, o.coins_redeemed, o.coins_refunded,
        COALESCE(mt.status, '') AS payment_status,
        COALESCE(mt.processor, '') AS payment_processor,
        COALESCE(mt.amount_final, 0) AS payment_amount,
        goi.order_item_id, goi.quantity, goi.unit_value, goi.line_total,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) AS brand_code,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name,
        CASE
            WHEN gc.coupon_id IS NOT NULL THEN 'GENERATED'
            WHEN o.status = 'PAID' THEN 'FAILED'
            WHEN o.status = 'PENDING' THEN 'NOT_APPLICABLE_PENDING'
            ELSE 'NOT_APPLICABLE_FAILED'
        END AS voucher_status,
        goi.last_evc_response_code, goi.last_evc_response_msg,
        goi.is_scratched, goi.is_gift
    FROM giftcard_orders o
    LEFT JOIN client_profile cp ON cp.client_id COLLATE utf8mb4_unicode_ci = o.client_id COLLATE utf8mb4_unicode_ci
    LEFT JOIN sabbpepayments.master_transactions mt ON mt.order_reference COLLATE utf8mb4_unicode_ci = o.order_number COLLATE utf8mb4_unicode_ci
    LEFT JOIN giftcard_order_items goi ON goi.order_id = o.order_id
    LEFT JOIN giftcard_coupons gc ON gc.order_item_id = goi.order_item_id
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
        AND (p_brand_code IS NULL OR p_brand_code = '' OR
             JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) = p_brand_code)
        AND (p_voucher_status IS NULL OR p_voucher_status = '' OR
             (p_voucher_status = 'generated' AND gc.coupon_id IS NOT NULL) OR
             (p_voucher_status = 'failed' AND o.status = 'PAID' AND gc.coupon_id IS NULL))
        AND (p_payment_method IS NULL OR p_payment_method = '' OR o.payment_method = p_payment_method)
        AND (p_search IS NULL OR p_search = '' OR
             o.order_number LIKE CONCAT('%', p_search, '%') OR
             cp.client_name LIKE CONCAT('%', p_search, '%') OR
             cp.client_email LIKE CONCAT('%', p_search, '%') OR
             cp.client_mobile LIKE CONCAT('%', p_search, '%') OR
             o.client_id LIKE CONCAT('%', p_search, '%'))
    ORDER BY o.created_at DESC
    LIMIT p_size OFFSET v_offset;
END//

-- ────────────────────────────────────────────────────────────
-- 3. ORDER DETAIL
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_order_detail//
CREATE PROCEDURE sp_admin_order_detail(
    IN p_order_number VARCHAR(50)
)
BEGIN
    -- Order info
    SELECT
        o.order_id, o.order_number, o.client_id, o.total_amount, o.status,
        o.created_at, o.paid_at, o.wallet_used, o.wallet_amount,
        o.payment_method, o.earn_cashback,
        o.coins_earned, o.coins_redeemed, o.coins_refunded,
        o.sc_merchant_txn_id, o.sc_reference_txn_id, o.sc_redeem_txn_id,
        cp.client_name, cp.client_email, cp.client_mobile
    FROM giftcard_orders o
    LEFT JOIN client_profile cp ON cp.client_id COLLATE utf8mb4_unicode_ci = o.client_id COLLATE utf8mb4_unicode_ci
    WHERE o.order_number = p_order_number;

    -- Order items with vouchers
    SELECT
        goi.order_item_id, goi.quantity, goi.unit_value, goi.line_total,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) AS brand_code,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name,
        goi.last_evc_response_code, goi.last_evc_response_msg,
        goi.is_scratched, goi.is_gift, goi.scratched_at, goi.gift_sent_at,
        gc.coupon_id, gc.status AS coupon_status
    FROM giftcard_order_items goi
    LEFT JOIN giftcard_coupons gc ON gc.order_item_id = goi.order_item_id
    WHERE goi.order_id = (SELECT order_id FROM giftcard_orders WHERE order_number = p_order_number LIMIT 1);

    -- Payment info
    SELECT
        mt.id AS payment_txn_id, mt.status AS payment_status,
        mt.processor, mt.amount_requested, mt.amount_final,
        mt.initiated_at, mt.completed_at,
        ept.bank_ref_num, ept.easepay_id, ept.mode AS payment_mode
    FROM sabbpepayments.master_transactions mt
    LEFT JOIN sabbpepayments.easebuzz_processor_transaction_details ept ON ept.master_transaction_id = mt.id
    WHERE mt.order_reference COLLATE utf8mb4_unicode_ci = p_order_number COLLATE utf8mb4_unicode_ci;

    -- Wallet transactions
    SELECT
        cwt.transaction_type, cwt.amount, cwt.previous_balance, cwt.new_balance,
        cwt.created_at, cwt.notes
    FROM client_wallet_transactions cwt
    WHERE cwt.order_id = (SELECT order_id FROM giftcard_orders WHERE order_number = p_order_number LIMIT 1)
    ORDER BY cwt.created_at;
END//

-- ────────────────────────────────────────────────────────────
-- 4. CUSTOMER LIST
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_customer_list//
CREATE PROCEDURE sp_admin_customer_list(
    IN p_from_date DATE,
    IN p_to_date DATE,
    IN p_search VARCHAR(255),
    IN p_status VARCHAR(20),
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT p_page * p_size;

    SELECT
        o.client_id, cp.client_name, cp.client_email, cp.client_mobile,
        cp.client_account_status,
        COUNT(DISTINCT o.order_id) AS total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.total_amount END), 0) AS total_spent,
        COUNT(DISTINCT CASE WHEN gc.coupon_id IS NOT NULL THEN goi.order_item_id END) AS vouchers_received,
        COALESCE(SUM(o.coins_earned), 0) AS supercoins_earned,
        MAX(o.created_at) AS last_order_at
    FROM giftcard_orders o
    LEFT JOIN client_profile cp ON cp.client_id COLLATE utf8mb4_unicode_ci = o.client_id COLLATE utf8mb4_unicode_ci
    LEFT JOIN giftcard_order_items goi ON goi.order_id = o.order_id
    LEFT JOIN giftcard_coupons gc ON gc.order_item_id = goi.order_item_id
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
        AND (p_search IS NULL OR p_search = '' OR
             cp.client_name LIKE CONCAT('%', p_search, '%') OR
             cp.client_email LIKE CONCAT('%', p_search, '%') OR
             cp.client_mobile LIKE CONCAT('%', p_search, '%') OR
             o.client_id LIKE CONCAT('%', p_search, '%'))
        AND (p_status IS NULL OR p_status = '' OR cp.client_account_status = p_status)
    GROUP BY o.client_id, cp.client_name, cp.client_email, cp.client_mobile, cp.client_account_status
    ORDER BY total_spent DESC
    LIMIT p_size OFFSET v_offset;
END//

-- ────────────────────────────────────────────────────────────
-- 5. CUSTOMER DETAIL
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_customer_detail//
CREATE PROCEDURE sp_admin_customer_detail(
    IN p_client_id VARCHAR(36)
)
BEGIN
    SELECT client_id, client_name, client_email, client_mobile,
           client_account_status, created_at
    FROM client_profile WHERE client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci;

    SELECT
        COUNT(DISTINCT o.order_id) AS total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.total_amount END), 0) AS total_spent,
        COALESCE(SUM(o.coins_earned), 0) AS supercoins_earned,
        COALESCE(SUM(o.coins_redeemed), 0) AS supercoins_redeemed,
        MAX(o.created_at) AS last_order_at
    FROM giftcard_orders o WHERE o.client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci;

    SELECT voucher_cashback_balance, total_balance, pending_earn_fraction
    FROM client_wallet WHERE client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci;

    SELECT COUNT(*) AS feedback_count, ROUND(AVG(overall), 2) AS avg_overall,
           ROUND(AVG(nps), 2) AS avg_nps
    FROM feedback WHERE client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci;
END//

-- ────────────────────────────────────────────────────────────
-- 6. CUSTOMER JOURNEY
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_customer_journey//
CREATE PROCEDURE sp_admin_customer_journey(
    IN p_client_id VARCHAR(36)
)
BEGIN
    SELECT * FROM (
        SELECT o.created_at AS event_at, 'ORDER' AS event_type,
            o.order_number AS ref, o.status AS status_detail,
            o.total_amount AS amount,
            (SELECT JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name'))
             FROM giftcard_order_items goi WHERE goi.order_id = o.order_id LIMIT 1) AS detail,
            o.coins_redeemed AS coins_involved
        FROM giftcard_orders o
        WHERE o.client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci

        UNION ALL

        SELECT f.created_at, 'FEEDBACK', CAST(f.overall AS CHAR) COLLATE utf8mb4_unicode_ci, CAST(f.nps AS CHAR) COLLATE utf8mb4_unicode_ci, NULL,
               COALESCE(f.suggestion, f.issue_detail) COLLATE utf8mb4_unicode_ci, NULL
        FROM feedback f
        WHERE f.client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci
    ) timeline
    ORDER BY event_at DESC;
END//

-- ────────────────────────────────────────────────────────────
-- 7. CUSTOMER BLOCK
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_customer_block//
CREATE PROCEDURE sp_admin_customer_block(
    IN p_client_id VARCHAR(36),
    IN p_status VARCHAR(20),
    IN p_reason TEXT,
    IN p_admin_user_id VARCHAR(36)
)
BEGIN
    DECLARE v_prev_status VARCHAR(20);

    SELECT client_account_status INTO v_prev_status
    FROM client_profile WHERE client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci;

    UPDATE client_profile
    SET client_account_status = p_status
    WHERE client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci;

    SELECT ROW_COUNT() AS rows_affected,
           v_prev_status AS previous_status,
           p_status AS new_status;
END//

-- ────────────────────────────────────────────────────────────
-- 8. VOUCHER FAILED
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_voucher_failed//
CREATE PROCEDURE sp_admin_voucher_failed(
    IN p_client_id VARCHAR(36),
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT p_page * p_size;

    SELECT
        go.order_number, goi.order_item_id, go.client_id,
        cp.client_name, cp.client_email,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) AS brand_code,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name,
        goi.quantity, goi.unit_value, goi.line_total,
        goi.last_evc_response_code, goi.last_evc_response_msg,
        goi.last_evc_attempt_at,
        go.paid_at, go.status AS order_status
    FROM giftcard_orders go
    INNER JOIN giftcard_order_items goi ON go.order_id = goi.order_id
    LEFT JOIN client_profile cp ON cp.client_id COLLATE utf8mb4_unicode_ci = go.client_id COLLATE utf8mb4_unicode_ci
    WHERE go.status = 'PAID' AND goi.status = 0
        AND (p_client_id IS NULL OR p_client_id = '' OR go.client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci)
    ORDER BY go.paid_at DESC
    LIMIT p_size OFFSET v_offset;
END//

-- ────────────────────────────────────────────────────────────
-- 9. VOUCHER RETRY ELIGIBLE
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_voucher_retry_eligible//
CREATE PROCEDURE sp_admin_voucher_retry_eligible()
BEGIN
    SELECT
        go.order_number AS original_order_number,
        goi.order_item_id AS order_item_id,
        goi.brand_id, goi.quantity, goi.unit_value, goi.line_total,
        go.paid_at AS order_paid_at,
        cp.client_name AS customer_name,
        cp.client_email AS customer_email,
        cp.client_mobile AS customer_mobile
    FROM sabbpepayments.master_transactions mt
    INNER JOIN giftcard_orders go ON go.order_number COLLATE utf8mb4_unicode_ci = mt.order_reference COLLATE utf8mb4_unicode_ci
    INNER JOIN giftcard_order_items goi ON go.order_id = goi.order_id
    LEFT JOIN client_profile cp ON cp.client_id COLLATE utf8mb4_unicode_ci = go.client_id COLLATE utf8mb4_unicode_ci
    WHERE UPPER(TRIM(mt.status)) IN ('SUCCESS','PAID','COMPLETED')
        AND UPPER(TRIM(go.status)) = 'PAID'
        AND COALESCE(goi.status, 0) = 0;
END//

-- ────────────────────────────────────────────────────────────
-- 10. VOUCHER RETRY METRICS
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_voucher_retry_metrics//
CREATE PROCEDURE sp_admin_voucher_retry_metrics()
BEGIN
    SELECT COUNT(DISTINCT mt.order_reference) AS eligible_order_count,
           COUNT(*) AS eligible_item_count
    FROM sabbpepayments.master_transactions mt
    INNER JOIN giftcard_orders go ON go.order_number COLLATE utf8mb4_unicode_ci = mt.order_reference COLLATE utf8mb4_unicode_ci
    INNER JOIN giftcard_order_items goi ON go.order_id = goi.order_id
    WHERE UPPER(TRIM(mt.status)) IN ('SUCCESS','PAID','COMPLETED')
        AND UPPER(TRIM(go.status)) = 'PAID'
        AND COALESCE(goi.status, 0) = 0;

    SELECT COUNT(*) AS total_retries_today,
           SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS success_today,
           SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS failed_today
    FROM giftcard_order_items
    WHERE created_at >= CURDATE();
END//

-- ────────────────────────────────────────────────────────────
-- 11. VOUCHER RETRY EXECUTE
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_voucher_retry_execute//
CREATE PROCEDURE sp_admin_voucher_retry_execute(
    IN p_order_number VARCHAR(50),
    IN p_order_item_id VARCHAR(100),
    IN p_admin_user_id VARCHAR(36)
)
BEGIN
    UPDATE giftcard_order_items
    SET status = 0
    WHERE order_item_id = p_order_item_id;

    SELECT ROW_COUNT() AS rows_affected,
           status AS current_status
    FROM giftcard_order_items
    WHERE order_item_id = p_order_item_id;
END//

-- ────────────────────────────────────────────────────────────
-- 12. SUPERCOIN TREND
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_supercoin_trend//
CREATE PROCEDURE sp_admin_supercoin_trend(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    SELECT
        DATE(o.created_at) AS day,
        COALESCE(SUM(o.coins_earned), 0) AS earned,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' AND EXISTS (
            SELECT 1 FROM giftcard_order_items goi2
            JOIN giftcard_coupons gc2 ON gc2.order_item_id = goi2.order_item_id
            WHERE goi2.order_id = o.order_id
        ) THEN o.coins_redeemed ELSE 0 END), 0) AS burnt,
        COALESCE(SUM(o.coins_refunded), 0) AS refunded
    FROM giftcard_orders o
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
        AND (o.coins_earned > 0 OR o.coins_redeemed > 0 OR o.coins_refunded > 0)
    GROUP BY DATE(o.created_at)
    ORDER BY day ASC;
END//

-- ────────────────────────────────────────────────────────────
-- 13. WALLET DETAIL
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_wallet_detail//
CREATE PROCEDURE sp_admin_wallet_detail(
    IN p_client_id VARCHAR(36)
)
BEGIN
    SELECT voucher_cashback_balance, total_balance, pending_earn_fraction
    FROM client_wallet WHERE client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci;

    SELECT transaction_type, amount, previous_balance, new_balance,
           order_id, created_at, notes
    FROM client_wallet_transactions
    WHERE client_id COLLATE utf8mb4_unicode_ci = p_client_id COLLATE utf8mb4_unicode_ci
    ORDER BY created_at DESC
    LIMIT 50;
END//

-- ────────────────────────────────────────────────────────────
-- 14. BRAND STATS
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_brand_stats//
CREATE PROCEDURE sp_admin_brand_stats(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    SELECT
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) AS brand_code,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name,
        COUNT(DISTINCT goi.order_item_id) AS total_items,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN goi.line_total END), 0) AS total_revenue,
        COUNT(DISTINCT CASE WHEN o.status = 'PAID' AND gc.coupon_id IS NOT NULL THEN goi.order_item_id END) AS vouchers_generated,
        COUNT(DISTINCT CASE WHEN o.status = 'PAID' AND gc.coupon_id IS NULL THEN goi.order_item_id END) AS vouchers_failed
    FROM giftcard_order_items goi
    JOIN giftcard_orders o ON o.order_id = goi.order_id
    LEFT JOIN giftcard_coupons gc ON gc.order_item_id = goi.order_item_id
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
    GROUP BY brand_code, brand_name
    ORDER BY total_revenue DESC;
END//

-- ────────────────────────────────────────────────────────────
-- 16. ERROR BREAKDOWN
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_error_breakdown//
CREATE PROCEDURE sp_admin_error_breakdown(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    SELECT
        goi.last_evc_response_code AS response_code,
        goi.last_evc_response_msg AS response_msg,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) AS brand_code,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name,
        COUNT(*) AS failure_count,
        COALESCE(SUM(goi.line_total), 0) AS amount_stuck
    FROM giftcard_order_items goi
    JOIN giftcard_orders o ON o.order_id = goi.order_id
    WHERE o.status = 'PAID'
        AND goi.last_evc_response_code IS NOT NULL
        AND o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
    GROUP BY response_code, response_msg, brand_code, brand_name
    ORDER BY failure_count DESC;
END//

-- ────────────────────────────────────────────────────────────
-- 17. ABANDONED CARTS
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_abandoned_carts//
CREATE PROCEDURE sp_admin_abandoned_carts(
    IN p_from_date DATE,
    IN p_to_date DATE,
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT p_page * p_size;

    SELECT
        o.order_number, o.status AS order_status, o.total_amount, o.created_at,
        cp.client_name, cp.client_email, cp.client_mobile,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name
    FROM giftcard_orders o
    LEFT JOIN client_profile cp ON cp.client_id COLLATE utf8mb4_unicode_ci = o.client_id COLLATE utf8mb4_unicode_ci
    LEFT JOIN giftcard_order_items goi ON goi.order_id = o.order_id
    WHERE o.status != 'PAID'
        AND o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
    ORDER BY o.created_at DESC
    LIMIT p_size OFFSET v_offset;
END//

-- ────────────────────────────────────────────────────────────
-- 18. RETENTION
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_retention//
CREATE PROCEDURE sp_admin_retention(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    SELECT DATE(order_level.created_at) AS day,
        ROUND(SUM(order_level.retention), 2) AS retention,
        COUNT(DISTINCT CASE WHEN order_level.flow_type = 'CASHBACK' THEN order_level.order_id END) AS cashback_orders,
        COUNT(DISTINCT CASE WHEN order_level.flow_type = 'SUPERCOINS' THEN order_level.order_id END) AS supercoins_orders,
        COUNT(DISTINCT CASE WHEN order_level.flow_type = 'STANDARD' THEN order_level.order_id END) AS standard_orders
    FROM (
        SELECT o.order_id, o.created_at,
            CASE
                WHEN NOT EXISTS (
                    SELECT 1 FROM giftcard_order_items goi7
                    JOIN giftcard_coupons gc7 ON gc7.order_item_id = goi7.order_item_id
                    WHERE goi7.order_id = o.order_id
                ) THEN 0
                WHEN o.earn_cashback = 1 THEN item_discount.discount_value
                WHEN o.coins_earned > 0 THEN o.coins_earned * 0.75
                ELSE 2 * item_discount.discount_value
            END AS retention,
            CASE
                WHEN NOT EXISTS (
                    SELECT 1 FROM giftcard_order_items goi8
                    JOIN giftcard_coupons gc8 ON gc8.order_item_id = goi8.order_item_id
                    WHERE goi8.order_id = o.order_id
                ) THEN 'NONE'
                WHEN o.earn_cashback = 1 THEN 'CASHBACK'
                WHEN o.coins_earned > 0 THEN 'SUPERCOINS'
                ELSE 'STANDARD'
            END AS flow_type
        FROM giftcard_orders o
        LEFT JOIN (
            SELECT goi9.order_id,
                SUM(COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(goi9.meta, '$.customer_discount_percent')) AS DECIMAL(10,4)), 0) / 100 * goi9.line_total) AS discount_value
            FROM giftcard_order_items goi9
            JOIN giftcard_coupons gc9 ON gc9.order_item_id = goi9.order_item_id
            GROUP BY goi9.order_id
        ) item_discount ON item_discount.order_id = o.order_id
        WHERE o.status = 'PAID' AND o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
    ) order_level
    GROUP BY DATE(order_level.created_at)
    ORDER BY day ASC;
END//

-- ────────────────────────────────────────────────────────────
-- 19. REFUND CHECK
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_refund_check//
CREATE PROCEDURE sp_admin_refund_check(
    IN p_order_number VARCHAR(50)
)
BEGIN
    SELECT
        o.order_number, o.total_amount, o.status AS order_status,
        o.payment_method, o.coins_redeemed,
        mt.status AS payment_status, mt.processor, mt.amount_final,
        CASE
            WHEN o.status = 'PAID' AND o.coins_redeemed = 0 THEN 'ELIGIBLE'
            WHEN o.status = 'PAID' AND o.coins_redeemed > 0 THEN 'SUPERCOIN_ORDER'
            ELSE 'NOT_ELIGIBLE'
        END AS refund_eligibility
    FROM giftcard_orders o
    LEFT JOIN sabbpepayments.master_transactions mt ON mt.order_reference COLLATE utf8mb4_unicode_ci = o.order_number COLLATE utf8mb4_unicode_ci
    WHERE o.order_number = p_order_number;
END//

-- ────────────────────────────────────────────────────────────
-- 20. CONFIG GET
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_config_get//
CREATE PROCEDURE sp_admin_config_get(
    IN p_config_type VARCHAR(50)
)
BEGIN
    IF p_config_type = 'supercoin' THEN
        SELECT 'cap_percent' AS config_key, '25' AS config_value
        UNION ALL SELECT 'earn_percent', '1'
        UNION ALL SELECT 'redemption_surcharge_percent', '25';
    ELSEIF p_config_type = 'wallet' THEN
        SELECT 'max_usage_percent' AS config_key, '60' AS config_value
        UNION ALL SELECT 'max_redeem_amount', '500'
        UNION ALL SELECT 'cashback_redeem_percent', '100';
    ELSEIF p_config_type = 'retry' THEN
        SELECT 'max_attempts' AS config_key, '3' AS config_value
        UNION ALL SELECT 'retry_window_hours', '72'
        UNION ALL SELECT 'idempotency_window_minutes', '2';
    END IF;
END//

-- ────────────────────────────────────────────────────────────
-- 21. CONFIG UPDATE
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_config_update//
CREATE PROCEDURE sp_admin_config_update(
    IN p_config_type VARCHAR(50),
    IN p_config_key VARCHAR(100),
    IN p_config_value VARCHAR(255),
    IN p_admin_user_id VARCHAR(36),
    IN p_reason TEXT
)
BEGIN
    SELECT p_config_type AS config_type,
           p_config_key AS config_key,
           p_config_value AS new_value,
           p_admin_user_id AS admin_user_id,
           NOW() AS updated_at;
END//

-- ────────────────────────────────────────────────────────────
-- 22. AUDIT LOG
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_audit_log//
CREATE PROCEDURE sp_admin_audit_log(
    IN p_admin_user_id VARCHAR(36),
    IN p_module VARCHAR(50),
    IN p_from_date DATE,
    IN p_to_date DATE,
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT p_page * p_size;

    SELECT id, admin_user_id, admin_username, action, module,
           target_entity, target_id, previous_value, new_value,
           reason, ip_address, correlation_id, result, created_at
    FROM admin_audit_logs
    WHERE (p_admin_user_id IS NULL OR admin_user_id = p_admin_user_id)
        AND (p_module IS NULL OR module = p_module)
        AND (p_from_date IS NULL OR created_at >= p_from_date)
        AND (p_to_date IS NULL OR created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY))
    ORDER BY created_at DESC
    LIMIT p_size OFFSET v_offset;
END//

-- ────────────────────────────────────────────────────────────
-- 23. INVESTIGATION NOTES
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_investigation_notes//
CREATE PROCEDURE sp_admin_investigation_notes(
    IN p_entity_type VARCHAR(50),
    IN p_entity_id VARCHAR(100)
)
BEGIN
    SELECT id, admin_user_id, entity_type, entity_id,
           note, is_internal, created_at, updated_at
    FROM admin_investigation_notes
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id
    ORDER BY created_at DESC;
END//

-- ────────────────────────────────────────────────────────────
-- 24. INVESTIGATION CREATE
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_admin_investigation_create//
CREATE PROCEDURE sp_admin_investigation_create(
    IN p_admin_user_id VARCHAR(36),
    IN p_entity_type VARCHAR(50),
    IN p_entity_id VARCHAR(100),
    IN p_note TEXT,
    IN p_is_internal TINYINT
)
BEGIN
    INSERT INTO admin_investigation_notes
    (admin_user_id, entity_type, entity_id, note, is_internal)
    VALUES (p_admin_user_id, p_entity_type, p_entity_id, p_note, p_is_internal);

    SELECT LAST_INSERT_ID() AS id, NOW() AS created_at;
END//

DELIMITER ;
