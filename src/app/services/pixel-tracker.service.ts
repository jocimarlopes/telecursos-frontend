import { Injectable } from '@angular/core';

declare var fbq: any;
declare var ttq: any;
@Injectable({
  providedIn: 'root'
})
export class PixelTrackerService {

  constructor() { }

  onRegister() {
    // fbq('track', 'CompleteRegistration'); // Evento de cadastro
    ttq.track('CompleteRegistration', {
      method: 'email', // ou 'google', 'facebook', etc
      user_type: 'free', // ou 'premium' se for direto no plano pago
      referrer: 'tiktok_ad'
    });
  }

  onPurchasePremium() {
    // fbq('track', 'Purchase', {
    //   value: 49.00, // valor da compra
    //   currency: 'BRL'
    // });
    ttq.track('Purchase', {
      value: 49.00,
      currency: 'BRL',
      course_name: 'Conta Premium Vitalício',
      plan: 'vitalício'
    });
  }

  onPurchaseCertified() {
    // fbq('track', 'Purchase', {
    //   value: 29.90, // valor da compra
    //   currency: 'BRL'
    // });
    ttq.track('Purchase', {
      value: 29.90,
      currency: 'BRL'
    });
  }

  onWelcome() {
    ttq.track('ViewContent');
  }

  initPurchase() {
    // fbq('track', 'InitiateCheckout');
    ttq.track('AddPaymentInfo', {
      plan: 'Vitalício',
      value: 49.00,
      currency: 'BRL'
    });
  }

  onGoRegister() {
    ttq.track('ClickButton');
  }

  onSearch(searchTerm: string, contentName: string) {
    ttq.track('Search', {
      content_type: 'course',
      content_name: contentName,
      content_category: 'cursos',
      query: searchTerm
    });
  }

  
}
