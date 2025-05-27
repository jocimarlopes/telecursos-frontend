import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
  standalone: false
})
export class PaymentsPage implements OnInit {
  isPremium: boolean = false;
  premiumSince: string = '';
  width: number = window.innerWidth;

  pix: any = null

  constructor(
    private user: UserService,
    private helper: HelperService,
    private api: ApiService,
    private alert: AlertController
  ) { }

  ngOnInit() {
    this.verifyUser()
    this.verifyWidth()
    this.verifyPix();
  }

  verifyUser() {
    this.user.userData$.subscribe(data => {
      if (data) {
        this.isPremium = !!parseInt(data.premium)
        this.premiumSince = data.updated_at;
      }
    })
  }

  verifyPix() {
    const pix = localStorage.getItem('pix');
    if (pix) {
      this.pix = JSON.parse(pix);
    }
  }

  verifyWidth() {
    this.helper.screenWidth$.subscribe(data => this.width = data)
  }

  goToHome() {
    this.helper.goToPage('/home');
  }

  goToProfile() {
    this.helper.goToPage('/profile');
  }

  goBack() {
    this.helper.goToPage('/home')
  }

  formatDate(date: string): string {
    return this.helper.epochToStringDate(date)
  }

  async getPix() {
    const token = this.user.getToken();
    if (!token) return
    await this.helper.loader('Obtendo Pix...');
    this.api.postWithToken('pix', {}, token).subscribe(async (data) => {
      await this.helper.closeLoader();
      if (data.status) {
        this.pix = data.pix
        localStorage.setItem('pix', JSON.stringify(data.pix));
      } else {
        this.helper.message('Erro ao obter Pix', 2000, 'danger');
      }
    }, async () => await this.helper.closeLoader())
  }

  copiaCola() {
    this.helper.copyToClipboard(this.pix.clipboard, 'Pix copiado para a área de transferência');
  }

  async verificaPagamento() {
    const token = this.user.getToken();
    if (!token) return
    await this.helper.loader('Obtendo Pix...');
    this.api.postWithToken('pix/status', { id: this.pix.id }, token).subscribe(async (data) => {
      await this.helper.closeLoader();
      console.log(data);
      if (data.status) {
        this.helper.message('Pagamento confirmado!', 2000, 'success');
        this.user.setToken(data.token);
        this.helper.goToPage('/home');
        localStorage.removeItem('pix');
        return
      }
      this.helper.message('Aguardando pagamento', 2000, 'warning');
    }, async () => await this.helper.closeLoader())

  }

  async resetarPix() {
    const alert = await this.alert.create({
      header: 'Resetar Pix?',
      message: 'Você tem certeza que deseja resetar o Pix? O pix atual será perdido mesmo que já tenha sido pago.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Resetar',
          handler: () => {
            this.pix = null;
            localStorage.removeItem('pix');
            this.helper.message('Pix resetado com sucesso', 2000, 'success');
          }
        }
      ],
    });
    await alert.present();
  }
}
