import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';
import { decodeCourseRef } from './course-ref';

/**
 * Detalhes do curso.
 *
 * Era o CourseDetailsComponent aberto como modal. Como página, ganha URL
 * compartilhável e sobrevive a um F5.
 */
@Component({
  selector: 'app-course',
  templateUrl: './course.page.html',
  styleUrls: ['./course.page.scss'],
  standalone: false,
})
export class CoursePage implements OnInit {

  course: any = null;
  cover = '';
  loading = true;
  failed = false;
  starting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public helper: HelperService,
    public user: UserService,
  ) {
    // A home passa a capa junto na navegação: o scraping de detalhes não
    // devolve a imagem, e sem isso a tela abriria sem capa vindo do catálogo.
    this.cover = this.router.getCurrentNavigation()?.extras?.state?.['course']?.image || '';
  }

  ngOnInit() {
    const ref = this.route.snapshot.paramMap.get('ref');
    if (!ref) return this.fail();

    let link: string;
    try {
      link = decodeCourseRef(ref);
    } catch {
      return this.fail();
    }
    this.load(link);
  }

  get isPremium(): boolean {
    return this.user.isPremium;
  }

  get isExpired(): boolean {
    return !!this.user.subscription?.expired;
  }

  /** Links de download reais (magnet). O upsell vem separado. */
  get downloadLinks(): any[] {
    return (this.course?.links || []).filter((l: any) => l.link?.startsWith('magnet:'));
  }

  get accessed(): boolean {
    return !!this.course?.download_infos;
  }

  private load(link: string) {
    this.loading = true;
    this.api.postLegacy('latest', { link }, this.user.getToken()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.course = res.data;
        if (!this.cover) this.cover = res.data?.image || '';
      },
      error: () => this.fail(),
    });
  }

  private fail() {
    this.loading = false;
    this.failed = true;
  }

  /** Registra o acesso e abre o link do curso. */
  startCourse(item: any) {
    this.starting = true;

    // A raspagem de detalhes não devolve a capa (só título, texto e links),
    // então mandamos junto a que já temos em tela. Sem isso o curso entra em
    // Meus Cursos sem imagem nenhuma.
    const payload = { ...this.course, image: this.cover || this.course?.image };

    this.api.postLegacy('save_course', payload, this.user.getToken()).subscribe({
      next: () => {
        this.starting = false;
        window.open(item.link, '_blank');
        // Recarrega para que a seção do certificado passe a mostrar o prazo.
        this.load(decodeCourseRef(this.route.snapshot.paramMap.get('ref')!));
      },
      error: () => {
        this.starting = false;
        this.helper.message('Não foi possível registrar o acesso. Tente novamente.',
          3500, 'danger');
      },
    });
  }

  goIssue() {
    this.helper.goToPage(`/certificados/emitir/${this.course.download_infos.uid}`);
  }

  goSubscribe() {
    this.helper.goToPage('/assinar');
  }

  goHowTo() {
    this.helper.goToPage('/como-acessar');
  }
}
