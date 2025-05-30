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
    ttq.track('CompleteRegistration');
  }

  onPurchasePremium() {
    // fbq('track', 'Purchase', {
    //   value: 49.90, // valor da compra
    //   currency: 'BRL'
    // });
    ttq.track('Purchase', {
      value: 49.90,
      currency: 'BRL'
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
    // ttq.page()
  }

  initPurchase() {
    // fbq('track', 'InitiateCheckout');
    ttq.track('AddPaymentInfo');

  }

  
}
