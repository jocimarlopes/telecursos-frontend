import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { GoogleAnalyticsService } from './services/google-analytics.service';
import { InstitutionService } from './services/institution.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {

  ready = false;

  constructor(
    private router: Router,
    private institution: InstitutionService,
    private analytics: GoogleAnalyticsService,
  ) { }

  ngOnInit() {
    this.redirectLegacyCertificateLink();
    this.bootstrapTenant();
    this.trackPageViews();
  }

  /** Um page_view por rota — o gtag.js vem com o pageview automático
   * desligado (ver src/index.html) porque isso é uma SPA. */
  private trackPageViews() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.analytics.trackPageView(event.urlAfterRedirects));
  }

  /**
   * Os QR Codes já impressos apontam para `cursando.pro/?c=<codigo>`.
   * A versão anterior baixava um JPG do certificado e o jogava na tela, sem
   * dizer se era válido, de quem era ou quantas horas tinha. Agora redireciona
   * para a página de validação, que mostra os dados e o selo de autenticidade.
   */
  private redirectLegacyCertificateLink() {
    const code = new URLSearchParams(window.location.search).get('c');
    if (code) {
      this.router.navigate(['/validar', code], { replaceUrl: true });
    }
  }

  /**
   * Num subdomínio de instituição, carrega a marca dela e leva direto para a
   * validação — é a única coisa que o subdomínio faz.
   */
  private bootstrapTenant() {
    if (!this.institution.isTenant) {
      this.ready = true;
      return;
    }

    this.institution.load().subscribe({
      next: (institution) => {
        this.ready = true;
        if (institution && this.isAtRoot()) {
          this.router.navigate(['/validar'], { replaceUrl: true });
        }
      },
      error: () => { this.ready = true; },
    });
  }

  private isAtRoot(): boolean {
    const path = window.location.pathname.replace(/\/+$/, '');
    return path === '' || path === '/';
  }
}
