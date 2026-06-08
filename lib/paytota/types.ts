export type PaytotaPurchaseStatus =
  | 'created'
  | 'pending'
  | 'pending_execute'
  | 'paid'
  | 'error'
  | 'cancelled';

export interface PaytotaPurchaseProduct {
  name: string;
  price: string;
}

export interface PaytotaCreatePurchasePayload {
  client: {
    email: string;
    phone: string;
    country: string;
    full_name?: string;
    city?: string;
    street_address?: string;
    zip_code?: string;
    state?: string;
  };
  purchase: {
    currency: string;
    products: PaytotaPurchaseProduct[];
  };
  reference: string;
  brand_id: string;
  skip_capture?: boolean;
  success_redirect?: string;
  failure_redirect?: string;
  cancel_redirect?: string;
}

export interface PaytotaPurchaseResponse {
  id: string;
  status: PaytotaPurchaseStatus;
  reference: string;
  checkout_url: string;
  event_type?: string;
  purchase?: {
    total: number;
    currency: string;
  };
}

export interface PaytotaExecuteResponse {
  status: string;
  details?: {
    return_code?: string;
    message?: string;
    transaction?: {
      status: string;
      internal_reference?: string;
    };
  };
}

export interface PaytotaWebhookPayload {
  id: string;
  status: PaytotaPurchaseStatus;
  reference: string;
  event_type?: string;
  type?: string;
}
