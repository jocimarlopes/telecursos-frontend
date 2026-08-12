import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

interface Template {
  uid: string;
  name: string;
  description?: string;
  workload_hours: number;
  price_cents: number;
  institution_name: string;
  institution_slug: string;
  primary_color: string;
}

/**
 * Escolha do modelo de certificado.
 *
 * Antes a emissão não tinha escolha nenhuma: existia um único modelo fixo e a
 * carga horária era sorteada a cada emissão. Agora o aluno vê os modelos
 * cadastrados no banco — instituição, carga horária e preço — e decide.
 */
@Component({
  selector: 'app-issue-certificate',
  templateUrl: './issue-certificate.page.html',
  styleUrls: ['./issue-certificate.page.scss'],
  standalone: false,
})
export class IssueCertificatePage implements OnInit {

  templates: Template[] = [];
  selected: Template | null = null;
  courseUid = '';
  loading = true;
  submitting = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public helper: HelperService,
    private user: UserService,
  ) { }

  ngOnInit() {
    this.courseUid = this.route.snapshot.paramMap.get('cursoUid') || '';
    this.loadTemplates();
  }

  private loadTemplates() {
    this.api.get('api/certificate-templates', this.user.getToken()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.templates = res.templates || [];
        this.selected = this.templates[0] ?? null;
      },
      error: () => {
        this.loading = false;
        this.error = 'Não foi possível carregar os modelos de certificado.';
      },
    });
  }

  /** Agrupa por instituição para o aluno escolher primeiro a marca. */
  get grouped(): { institution: string; templates: Template[] }[] {
    const groups = new Map<string, Template[]>();
    for (const template of this.templates) {
      const list = groups.get(template.institution_name) || [];
      list.push(template);
      groups.set(template.institution_name, list);
    }
    return [...groups.entries()].map(([institution, templates]) => ({ institution, templates }));
  }

  select(template: Template) {
    this.selected = template;
  }

  submit() {
    if (!this.selected) return;
    this.error = '';
    this.submitting = true;

    this.api.post('api/certificates', {
      course_uid: this.courseUid,
      template_uid: this.selected.uid,
    }, this.user.getToken()).subscribe({
      next: (res: any) => {
        this.submitting = false;

        if (res.requires_payment) {
          this.helper.goToPage('/assinar', {
            queryParams: { certificado: res.certificate.uid },
          });
          return;
        }

        this.helper.message('Certificado emitido!', 3000, 'success');
        window.open(
          `${environment.API_URL}/api/certificates/${res.certificate.verification_code}/pdf`,
          '_blank',
        );
        this.helper.goToPage('/certificados');
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message || 'Não foi possível emitir o certificado.';
      },
    });
  }
}
