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
export class CourseDetailsComponent  implements OnInit {

  @Input('details') details: any = null;
  @Input('isPremium') isPremium: boolean = false;

  constructor(
    private modal: ModalController,
    private helper: HelperService,
    private user: UserService,
    private api: ApiService
  ) { }

  ngOnInit() {
    console.log(this.details, '<- details');
    
  }

  close() {
    this.modal.dismiss()
  }

  openLink(item: any) {
    if(item.link.includes('magnet:')) {
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

  solicitarCertificado(details: any) {
    // this.modal.dismiss();
    // console.log(details);
    
    // this.helper.solicitarCertificado(details);      
  }

  verifyDownloadDate(date: string) {
    if (!date) return false;
    const downloadDate = new Date(parseInt(date) * 1000);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - downloadDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Verifica se a data é dentro dos últimos 7 dias
  }
}
