/**
 * Integración Mercado Pago — interfaz y mock para MVP.
 * Reemplazar por SDK real (mercadopago o @mercadopago/sdk-react) en producción.
 */

export interface CreatePreferenceParams {
  amount_cents: number;
  contribution_id: string;
  member_id: string;
  description: string;
  payer_email?: string;
}

export interface CreatePreferenceResult {
  preference_id: string;
  init_point: string;
  sandbox_init_point?: string;
}

export interface MercadoPagoService {
  createPreference(params: CreatePreferenceParams): Promise<CreatePreferenceResult>;
  verifyPayment(external_id: string): Promise<{ paid: boolean; amount_cents: number }>;
}

/** Mock: simula creación de preferencia y devuelve URL de prueba. */
export const mockMercadoPagoService: MercadoPagoService = {
  async createPreference(params) {
    console.log("[MercadoPago mock] createPreference", params);
    return {
      preference_id: `mock_${params.contribution_id}_${Date.now()}`,
      init_point: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock_${params.contribution_id}`,
      sandbox_init_point: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock_${params.contribution_id}`,
    };
  },
  async verifyPayment(external_id) {
    console.log("[MercadoPago mock] verifyPayment", external_id);
    return { paid: true, amount_cents: 0 };
  },
};

/** En producción: usar process.env.MERCADOPAGO_ACCESS_TOKEN y SDK. */
export function getMercadoPagoService(): MercadoPagoService {
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    // return realMercadoPagoService;
  }
  return mockMercadoPagoService;
}
