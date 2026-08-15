import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { InstitutionService } from 'src/app/services/institution.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.page.html',
  styleUrls: ['./certificates.page.scss'],
  standalone: false,
})
export class CertificatesPage implements OnInit {

  certificates: any[] = [];
  loading = true;
  failed = false;

  constructor(
    private api: ApiService,
    public helper: HelperService,
    private user: UserService,
    private institutions: InstitutionService,
  ) { }

  ngOnInit() {
    this.load();
  }

  load(event?: any) {
    this.loading = !event;
    this.failed = false;
    this.api.get('api/certificates', this.user.getToken()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.certificates = (res.certificates || [])
          .filter((c: any) => c.status === 'active');
        event?.target?.complete();
      },
      error: () => {
        this.loading = false;
        this.failed = true;
        event?.target?.complete();
      },
    });
  }

  download(certificate: any) {
    window.open(
      `${environment.API_URL}/api/certificates/${certificate.verification_code}/pdf`,
      '_blank',
    );
  }

  /** Link público de verificação, no subdomínio da instituição emissora
   * (quando ela tiver um — a instituição padrão valida no domínio raiz). */
  verifyUrl(certificate: any): string {
    return this.institutions.verificationUrl(
      certificate.institution_slug, certificate.verification_code);
  }

  copyVerifyLink(certificate: any) {
    this.helper.copyToClipboard(
      this.verifyUrl(certificate),
      'Link de verificação copiado', 2500,
    );
  }

  copyCode(certificate: any) {
    this.helper.copyToClipboard(certificate.verification_code, 'Código copiado', 2000);
  }

  trackByUid(_: number, certificate: any) {
    return certificate.uid;
  }
}
