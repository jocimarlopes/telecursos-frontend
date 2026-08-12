import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { Institution, InstitutionService } from 'src/app/services/institution.service';

interface Validation {
  valid: boolean;
  reason?: 'not_found' | 'revoked' | 'pending';
  message?: string;
  revoked_reason?: string;
  verification_code?: string;
  student_name?: string;
  course_title?: string;
  workload_hours?: number;
  completed_at?: string;
  issued_at?: string;
  institution?: { name: string; slug: string; primary_color: string; site_url?: string };
  download_url?: string;
}

/**
 * Página pública de verificação de autenticidade.
 *
 * É o que o subdomínio da instituição serve: senai.cursando.pro/validar.
 * Não exige login — quem confere um certificado normalmente é o RH ou o
 * empregador, que não tem conta na plataforma.
 */
@Component({
  selector: 'app-validate',
  templateUrl: './validate.page.html',
  styleUrls: ['./validate.page.scss'],
  standalone: false,
})
export class ValidatePage implements OnInit {

  code = '';
  result: Validation | null = null;
  loading = false;
  searched = false;
  institution: Institution | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public helper: HelperService,
    public institutions: InstitutionService,
  ) { }

  ngOnInit() {
    this.institutions.institution$.subscribe(i => this.institution = i);

    this.route.paramMap.subscribe(params => {
      const code = params.get('codigo');
      if (code) {
        this.code = code;
        this.validate();
      }
    });
  }

  /** Deixa o usuário digitar com ou sem hífen, minúsculo ou maiúsculo. */
  onCodeInput(event: any) {
    this.code = (event.target.value || '').toUpperCase();
  }

  submit() {
    const clean = this.code.trim();
    if (!clean) {
      this.helper.message('Digite o código do certificado', 2500, 'warning');
      return;
    }
    // Navegar em vez de só buscar dá URL própria ao resultado, que é o que
    // alguém conferindo um certificado precisa poder guardar ou encaminhar.
    this.router.navigate(['/validar', clean]);
  }

  private validate() {
    this.loading = true;
    this.searched = true;
    this.api.get(`api/certificates/validate/${encodeURIComponent(this.code.trim())}`)
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.result = res;
        },
        error: () => {
          this.loading = false;
          this.result = {
            valid: false,
            message: 'Não foi possível verificar agora. Tente novamente em instantes.',
          };
        },
      });
  }

  reset() {
    this.result = null;
    this.searched = false;
    this.code = '';
    this.router.navigate(['/validar']);
  }

  download() {
    if (!this.result?.verification_code) return;
    window.open(
      `${environment.API_URL}/api/certificates/${this.result.verification_code}/pdf`,
      '_blank',
    );
  }

  get brandName(): string {
    return this.institution?.name || 'Cursando.Pro';
  }
}
