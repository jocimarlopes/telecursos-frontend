import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'course-details',
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.scss'],
  standalone: false
})
export class CourseDetailsComponent implements OnInit {

  @Input('details') details: any = null;
  @Input('isPremium') isPremium: boolean = false;
  solicitarCertificadoText: string = '';
  timeoutSubscription: any

  constructor(
    private modal: ModalController,
    private helper: HelperService,
    private user: UserService,
    private api: ApiService
  ) { }

  ngOnInit() {
    this.verifyDownloadedDate()

  }

  ngOnDestroy() {
    if (this.timeoutSubscription) {
      clearInterval(this.timeoutSubscription);
    }
  }

  close() {
    this.modal.dismiss()
  }

  openLink(item: any) {
    if (item.link.includes('magnet:')) {
      this.saveCourse(item)
    } else {
      this.modal.dismiss()
      this.helper.goToPage(item.link)
    }
  }

  async saveCourse(item: any) {
    const token = this.user.getToken();
    if (!token) return this.user.resetarUsuario();
    await this.helper.loader('Verificando curso...');
    this.api.postWithToken('save_course', this.details, token).subscribe(async (data: any) => {
      await this.helper.closeLoader();
      this.modal.dismiss();
      window.open(item.link, '_blank');
    })
  }

  async solicitarCertificado(details: any) {
    const token = this.user.getToken();
    if (!token) return this.user.resetarUsuario();
    await this.helper.loader('Solicitando certificado...');
    this.api.postWithTokenBlob('get_certified', details, token).subscribe(async (pdfBlob: Blob) => {
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'certificado.pdf';
      a.click();
      URL.revokeObjectURL(blobUrl);

    }, async () => {
      await this.helper.closeLoader();
      this.helper.message('Erro ao solicitar certificado. Tente novamente mais tarde.', 4000, 'danger');
    })
  }

  verifyDownloadDate(date: string) {
    if (!date) return false;
    const downloadDate = new Date(parseInt(date) * 1000);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - downloadDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Verifica se a data é dentro dos últimos 7 dias
  }

  verifyDownloadedDate() {
    const epochTimestamp = this.details?.download_infos?.downloaded_at;
    const downloadedDate = new Date(parseInt(epochTimestamp) * 1000);
    const futureDate = new Date(downloadedDate);
    futureDate.setDate(futureDate.getDate() + (7)); // 7 semanas
    this.setCertifiedText(futureDate);

    this.timeoutSubscription = setInterval(() => {
      this.setCertifiedText(futureDate);
    }, 1000);
  }


  setCertifiedText(futureDate: Date) {
    const currentDate = new Date();
    if (currentDate < futureDate) {
      const diffMs = futureDate.getTime() - currentDate.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(diffSeconds / (3600 * 24));
      const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      this.solicitarCertificadoText = `Emissão de Certificado em ${days} dias, ${hours}h ${minutes}m ${seconds}s`;
    }
    else {
      this.solicitarCertificadoText = 'Emitir Certificado';
      clearInterval(this.timeoutSubscription);
    }
  }
}
