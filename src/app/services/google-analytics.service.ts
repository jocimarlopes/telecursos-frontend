import { Injectable } from '@angular/core';

declare var gtag: any;

/**
 * Google Analytics 4 (gtag.js, carregado em src/index.html).
 *
 * Só cobre pageview por enquanto — de propósito, é o pedido atual. Eventos
 * de conversão (cadastro, compra) ficam pra uma etapa separada, junto da
 * correção do PixelTrackerService (TikTok).
 */
@Injectable({ providedIn: 'root' })
export class GoogleAnalyticsService {

  /** page_path muda a cada rota; page_location precisa da URL inteira, senão
   * o relatório do GA4 mostra todo acesso como se fosse a mesma página. */
  trackPageView(path: string) {
    if (typeof gtag === 'undefined') return; // bloqueador de anúncio, etc.
    gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: document.title,
    });
  }
}
