import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

declare const MercadoPago: any;

/**
 * Carrega o SDK do Mercado Pago sob demanda e tokeniza o cartão no navegador.
 *
 * O número do cartão nunca chega ao nosso backend: o SDK troca os dados por um
 * token de uso único, e só o token é enviado. É o que mantém a integração fora
 * do escopo pesado de PCI.
 */
@Injectable({ providedIn: 'root' })
export class MercadoPagoService {

  private sdk: any = null;
  private loading: Promise<void> | null = null;

  /** Parcela mínima aceita: R$ 5,00. Abaixo disso não faz sentido oferecer. */
  private readonly MIN_INSTALLMENT_CENTS = 500;
  private readonly MAX_INSTALLMENTS = 12;

  constructor(private api: ApiService) { }

  async load(): Promise<void> {
    if (this.sdk) return;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      const res: any = await firstValueFrom(this.api.get('api/payments/public-key'));
      const publicKey = res?.public_key;
      if (!publicKey) throw new Error('Chave pública do Mercado Pago não configurada');

      await this.injectScript();
      this.sdk = new MercadoPago(publicKey, { locale: 'pt-BR' });
    })();

    return this.loading;
  }

  private injectScript(): Promise<void> {
    if (typeof MercadoPago !== 'undefined') return Promise.resolve();

    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-mp-sdk]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Falha ao carregar o SDK')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.dataset['mpSdk'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar o SDK do Mercado Pago'));
      document.head.appendChild(script);
    });
  }

  /** Troca os dados do cartão por um token de uso único. */
  async createCardToken(card: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    identificationType: string;
    identificationNumber: string;
  }): Promise<{ token: string; payment_method_id: string }> {
    await this.load();

    const digits = card.cardNumber.replace(/\D/g, '');
    if (digits.length < 13) throw new Error('Confira o número do cartão.');

    const methods = await this.sdk.getPaymentMethods({ bin: digits.slice(0, 8) });
    const paymentMethod = methods?.results?.[0];
    if (!paymentMethod) throw new Error('Cartão não reconhecido. Confira o número.');

    const result = await this.sdk.createCardToken({
      ...card,
      cardNumber: digits,
      cardExpirationYear: this.normalizeYear(card.cardExpirationYear),
    });

    if (!result?.id) throw new Error('Não foi possível validar o cartão.');
    return { token: result.id, payment_method_id: paymentMethod.id };
  }

  /** Aceita o ano em 2 ou 4 dígitos. */
  private normalizeYear(year: string): string {
    const clean = (year || '').replace(/\D/g, '');
    return clean.length === 2 ? `20${clean}` : clean;
  }

  /** Parcelas oferecidas, limitadas pelo valor mínimo por parcela. */
  installmentOptions(amountCents: number): number[] {
    const max = Math.min(
      this.MAX_INSTALLMENTS,
      Math.max(1, Math.floor(amountCents / this.MIN_INSTALLMENT_CENTS)),
    );
    return Array.from({ length: max }, (_, i) => i + 1);
  }
}
