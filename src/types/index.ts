export interface ViolationItem {
  statute: string;
  violation_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | string;
  description: string;
  potential_fine: string;
}

export interface RegulatoryScorecard {
  grade: 'GRADE A' | 'GRADE B' | 'GRADE C' | 'GRADE F' | string;
  compliance_score: number;
  status_label: string;
  violations: ViolationItem[];
  audit_timestamp: string;
}

export interface ProductInfo {
  title: string;
  store_name: string;
  url: string;
  advertised_price: number;
  currency: string;
  description?: string;
  image_url?: string;
}

export interface CartBreakdown {
  base_price: number;
  handling_fee: number;
  delivery_fee: number;
  taxes: number;
  hidden_surcharges: number;
  final_total: number;
  delta_amount: number;
  delta_percentage: number;
  currency: string;
  dark_patterns_detected: string[];
  audit_summary?: string;
  regulatory_scorecard?: RegulatoryScorecard;
}

export interface StripRequest {
  cart_session_id: string;
  product_name: string;
  current_total: number;
  patterns_to_strip?: string[];
  use_mock?: boolean;
}

export interface StripResult {
  original_total: number;
  sanitized_total: number;
  total_saved: number;
  items_removed: string[];
  clean_cart_url: string;
  status: string;
}

export type AuditEventType =
  | 'STARTED'
  | 'PROGRESS'
  | 'STREAMING_URL'
  | 'AUDIT_COMPLETE'
  | 'ERROR'
  | 'STRIP_START'
  | 'STRIP_ACTION'
  | 'STRIP_COMPLETE';

export interface AuditEvent {
  type: AuditEventType;
  rawType?: string;
  message: string;
  timestamp: number;
  data?: {
    query?: string;
    target_url?: string;
    stream_url?: string;
    streaming_url?: string;
    action?: string;
    candidates?: any[];
    product?: ProductInfo;
    cart_breakdown?: CartBreakdown;
    regulatory_scorecard?: RegulatoryScorecard;
    postal_code?: string;
    result?: any;
    [key: string]: any;
  };
}

export interface DemoPreset {
  id: string;
  name: string;
  category: string;
  query: string;
  postal_code: string;
  badge: string;
  advertised_price: number;
  expected_pattern: string;
}

export interface ArbitrageRequest {
  query?: string;
  postal_code?: string;
  use_mock?: boolean;
}

export interface MerchantCheckoutSummary {
  merchant_name: string;
  advertised_price: number;
  base_price: number;
  shipping_fee: number;
  convenience_fee: number;
  tax_and_surcharges: number;
  final_total: number;
  dark_patterns_count: number;
  dark_patterns: string[];
  compliance_grade: string;
  is_true_winner: boolean;
}

export interface ArbitrageResult {
  product_name: string;
  postal_code: string;
  merchant_a: MerchantCheckoutSummary;
  merchant_b: MerchantCheckoutSummary;
  initial_perceived_winner: string;
  actual_true_winner: string;
  arbitrage_delta: number;
  verdict_summary: string;
}
