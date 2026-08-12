import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';

/** Curso como a vitrine pública recebe do backend. */
interface ShowcaseCourse {
  name: string;
  image?: string;
  little_description?: string;
}

/**
 * Porta de entrada do domínio principal.
 *
 * Antes a rota "" era o formulário de login. Quem já tem sessão vai direto
 * para o catálogo; quem não tem entende primeiro o que a plataforma faz.
 */
@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: false,
})
export class LandingPage implements OnInit {

  code = '';

  /**
   * Duas esteiras que giram em sentidos opostos. Cada uma vem duplicada — a
   * animação translada 50% da faixa e, como as duas metades são idênticas,
   * o ponto de corte é invisível: parece um rolo contínuo, não um GIF que
   * "pula" ao reiniciar.
   */
  laneA: ShowcaseCourse[] = [];
  laneB: ShowcaseCourse[] = [];

  /** Preços vindos do servidor — a landing nunca escreve valor no HTML. */
  priceCents = 0;
  certificatePriceCents = 0;
  courseCount = 0;

  constructor(
    private api: ApiService,
    public helper: HelperService,
    private user: UserService,
  ) { }

  ngOnInit() {
    const token = this.user.getToken();
    if (token && this.helper.tokenIsValid(token)) {
      this.helper.goToPage('/home');
      return;
    }
    this.loadShowcase();
    this.loadPricing();
  }

  /**
   * O preço anunciado vem da mesma constante que cobra no checkout.
   *
   * Escrever "R$ 49,90" no HTML pareceria mais simples, mas já houve um caso
   * de valor divulgado divergindo do cobrado — e numa landing pública esse
   * erro vira reclamação de propaganda enganosa, não só bug.
   */
  private loadPricing() {
    this.api.get('api/pricing').subscribe({
      next: (res: any) => {
        this.priceCents = res.premium_price_cents ?? 0;
        this.certificatePriceCents = res.certificate_price_cents ?? 0;
      },
      error: () => { this.priceCents = 0; },
    });
  }

  get priceLabel(): string {
    return this.priceCents ? this.helper.formatMoney(this.priceCents) : '';
  }

  get certificatePriceLabel(): string {
    return this.certificatePriceCents
      ? this.helper.formatMoney(this.certificatePriceCents) : '';
  }

  private loadShowcase() {
    this.api.get('api/popular-courses?limit=18').subscribe({
      next: (res: any) => {
        const courses: ShowcaseCourse[] = res.courses || [];
        // Intercala em duas listas para as esteiras não mostrarem sempre a
        // mesma dupla de cursos alinhada uma sobre a outra.
        this.courseCount = courses.length;
        const a = courses.filter((_, i) => i % 2 === 0);
        const b = courses.filter((_, i) => i % 2 === 1);
        this.laneA = [...a, ...a];
        this.laneB = [...b, ...b];
      },
      error: () => { this.laneA = []; this.laneB = []; },
    });
  }

  get hasShowcase(): boolean {
    return this.laneA.length + this.laneB.length > 0;
  }

  trackByCourse(index: number, course: ShowcaseCourse): string {
    return course.name + index;
  }

  /** Curso é conteúdo protegido — quem clica aqui ainda não tem conta. */
  openCourse() {
    this.helper.goToPage('/cadastrar');
  }

  go(route: string) {
    this.helper.goToPage(route);
  }

  validate() {
    const clean = this.code.trim();
    this.helper.goToPage(clean ? `/validar/${clean}` : '/validar');
  }
}
