import { Component, OnInit, ViewChild } from '@angular/core';
import { InfiniteScrollCustomEvent, IonContent } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { PixelTrackerService } from 'src/app/services/pixel-tracker.service';
import { UserService } from 'src/app/services/user.service';
import { encodeCourseRef } from '../course/course-ref';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;

  courses: any[] = [];
  nextPage = '';
  searchTerm = '';
  isSearching = false;
  loading = false;
  loadingMore = false;
  failed = false;

  /** Cursos que outros alunos estão fazendo — vitrine do topo da home. */
  popular: any[] = [];
  openingPopular = '';

  private searchSub?: Subscription;
  private searchDebounce: any;

  constructor(
    private api: ApiService,
    private helper: HelperService,
    public user: UserService,
    private tracking: PixelTrackerService,
  ) { }

  ngOnInit() {
    this.loadCourses();
    this.loadPopular();
  }

  /** Carrega a vitrine. Falha em silêncio: é conteúdo acessório da home. */
  private loadPopular() {
    this.api.get('api/popular-courses').subscribe({
      next: (res: any) => { this.popular = res.courses || []; },
      error: () => { this.popular = []; },
    });
  }

  /**
   * Abre um curso da vitrine.
   *
   * A vitrine vem do nosso banco, que guarda o magnet do torrent — não a URL
   * da página do curso, que é o que a tela de detalhes precisa. Então
   * resolvemos o link buscando pelo título e navegando para o primeiro
   * resultado. Se não achar, cai para a busca na própria home, que ao menos
   * mostra ao usuário o que existe com aquele termo.
   */
  openPopular(course: any) {
    if (this.openingPopular) return;
    this.openingPopular = course.name;

    this.api.postLegacy('latest', { search: course.name }, this.user.getToken())
      .subscribe({
        next: (res: any) => {
          this.openingPopular = '';
          const match = (res.data || [])[0];
          if (!match?.link) return this.fallbackToSearch(course.name);
          this.helper.goToPage(`/curso/${encodeCourseRef(match.link)}`, {
            state: { course: { ...match, image: course.image || match.image } },
          });
        },
        error: () => {
          this.openingPopular = '';
          this.helper.message('Não foi possível abrir o curso agora.', 3000, 'danger');
        },
      });
  }

  private fallbackToSearch(term: string) {
    this.searchTerm = term;
    this.runSearch(term);
    this.scrollToTop();
  }

  get isPremium(): boolean {
    return this.user.isPremium;
  }

  get isExpired(): boolean {
    return !!this.user.subscription?.expired;
  }

  get daysLeft(): number | null {
    return this.user.daysLeft;
  }

  loadCourses(event?: any) {
    this.isSearching = false;
    this.searchTerm = '';
    this.loading = true;
    this.failed = false;

    this.api.postLegacy('latest', {}, this.user.getToken()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.nextPage = res.data.page;
        this.courses = res.data.data;
        event?.target?.complete();
      },
      error: () => {
        this.loading = false;
        this.failed = true;
        event?.target?.complete();
      },
    });
  }

  loadMore(event: InfiniteScrollCustomEvent) {
    // Na busca não há paginação; e sem próxima página não há o que carregar.
    if (this.isSearching || !this.nextPage) {
      event.target.complete();
      event.target.disabled = true;
      return;
    }

    this.loadingMore = true;
    this.api.postLegacy('latest', { page: this.nextPage }, this.user.getToken()).subscribe({
      next: (res: any) => {
        this.loadingMore = false;
        this.nextPage = res.data.page;
        this.courses = [...this.courses, ...res.data.data];
        event.target.complete();
      },
      error: () => {
        this.loadingMore = false;
        event.target.complete();
      },
    });
  }

  onSearchInput(event: Event) {
    const query = ((event.target as HTMLIonSearchbarElement).value || '').trim();
    this.searchTerm = query;

    // Sem debounce, cada tecla disparava um scraping no servidor de origem.
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      if (!query) return this.loadCourses();
      this.runSearch(query);
    }, 400);
  }

  trackByPopular(_: number, course: any) {
    return course.name;
  }

  private runSearch(query: string) {
    this.searchSub?.unsubscribe();
    this.loading = true;
    this.failed = false;
    this.isSearching = true;

    this.searchSub = this.api.postLegacy('latest', { search: query }, this.user.getToken())
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.courses = res.data || [];
          if (this.courses.length) {
            this.tracking.onSearch(query, this.courses[0].title || 'Curso Profissionalizante');
          }
        },
        error: () => {
          this.loading = false;
          this.failed = true;
        },
      });
  }

  /**
   * Abre a tela do curso.
   *
   * Antes isso carregava os detalhes aqui e abria um modal. Agora a própria
   * tela do curso busca o que precisa a partir da URL, então o endereço pode
   * ser compartilhado e o botão voltar funciona.
   */
  openCourse(course: any) {
    this.helper.goToPage(`/curso/${encodeCourseRef(course.link)}`, {
      state: { course },
    });
  }

  refresh(event: CustomEvent) {
    this.loadCourses(event);
  }

  scrollToTop() {
    this.content?.scrollToTop(300);
  }

  goSubscribe() {
    this.helper.goToPage('/assinar');
  }

  trackByCourse(_: number, course: any) {
    return course.link;
  }
}
