import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiService } from './api.service';

export interface Institution {
  uid: string;
  slug: string;
  name: string;
  legal_name?: string;
  primary_color: string;
  secondary_color: string;
  site_url?: string;
  has_logo?: boolean;
}

/**
 * Descobre qual instituição está sendo acessada a partir do subdomínio e
 * aplica a marca dela na página.
 *
 *   senai.cursando.pro -> slug "senai"
 *   cursando.pro       -> nenhum (portal principal)
 *   senai.localhost:8100    -> slug "senai" (desenvolvimento)
 */
@Injectable({ providedIn: 'root' })
export class InstitutionService {

  private institutionSubject = new BehaviorSubject<Institution | null>(null);
  institution$: Observable<Institution | null> = this.institutionSubject.asObservable();

  /** Hosts que representam a raiz — o que estiver à esquerda deles é o slug. */
  private readonly rootDomains = ['cursando.pro', 'localhost', '127.0.0.1'];

  /** Subdomínios de infraestrutura que nunca são instituição. */
  private readonly nonTenant = ['www', 'api', 'app'];

  private resolved = false;

  constructor(private api: ApiService) { }

  get current(): Institution | null {
    return this.institutionSubject.getValue();
  }

  /** True quando estamos num subdomínio de instituição. */
  get isTenant(): boolean {
    return !!this.detectSlug();
  }

  detectSlug(host: string = window.location.hostname): string | null {
    const clean = (host || '').split(':')[0].toLowerCase();
    if (!clean || this.rootDomains.includes(clean)) return null;
    if (clean.endsWith('.vercel.app')) return null;

    for (const root of this.rootDomains) {
      if (clean.endsWith('.' + root)) {
        const slug = clean.slice(0, -(root.length + 1)).split('.')[0];
        return this.nonTenant.includes(slug) ? null : slug;
      }
    }
    return null;
  }

  /** Carrega a marca da instituição do subdomínio, se houver. */
  load(): Observable<Institution | null> {
    const slug = this.detectSlug();
    if (!slug || this.resolved) return of(this.current);

    return this.api.get(`api/institutions/${slug}`).pipe(
      map((res: any) => (res?.institution as Institution) ?? null),
      tap((institution) => {
        this.resolved = true;
        this.institutionSubject.next(institution);
        if (institution) this.applyBranding(institution);
      }),
      catchError(() => {
        this.resolved = true;
        return of(null);
      }),
    );
  }

  logoUrl(slug?: string): string {
    return `${environment.API_URL}/api/institutions/${slug ?? this.current?.slug}/logo`;
  }

  /**
   * Repinta a cor de marca da página com a da instituição.
   * Só a cor de ação muda — a estrutura clara e o verde de autenticidade são
   * da plataforma e permanecem constantes, para que o selo de "verificado"
   * signifique a mesma coisa em qualquer subdomínio.
   */
  private applyBranding(institution: Institution) {
    const root = document.documentElement;
    if (institution.primary_color) {
      root.style.setProperty('--tc-brand', institution.primary_color);
      root.style.setProperty('--ion-color-primary', institution.primary_color);
    }
    document.title = `${institution.name} — Verificação de certificado`;
  }
}
