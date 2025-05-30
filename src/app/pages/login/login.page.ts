import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { WelcomeComponent } from 'src/app/components/welcome/welcome.component';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  email: string = ''
  password: string = ''

  constructor(
    private helper: HelperService,
    private user: UserService,
    private api: ApiService,
    private modal: ModalController
  ) { }

  ngOnInit() {
    this.verifyCredentials()
    this.verifyUser()
    this.verifyWelcome()
  }

  verifyWelcome() {
    const welcome = localStorage.getItem('welcome')
    if (!welcome) {
      this.openWelcomeModal()
    }
  }

  async openWelcomeModal() {
    const modal = await this.modal.create({
      component: WelcomeComponent,
      cssClass: 'welcome-modal',
      backdropDismiss: false
    })

    await modal.present()
  }



  verifyCredentials() {
    this.email = localStorage.getItem('email') || ''
    this.password = localStorage.getItem('password') || ''
    this.user.userCredentials$.subscribe(data => {
      this.email = data?.email
      this.password = data?.password
    })
  }

  async verifyUser() {
    const token: any = localStorage.getItem('token')
    if(token && this.helper.tokenIsValid(token)) {
      await this.helper.loader('Bem-vindo(a) de volta...')
      this.api.refreshToken(token).subscribe(async (res: any) => {
        await this.helper.closeLoader()
        if(res.status) {
          this.user.setToken(res.token)
          localStorage.setItem('email', this.email)
          localStorage.setItem('password', this.password)
          this.helper.goToPage('/home')
        } else {
          this.helper.message('Token inválido, por favor faça login novamente', 3000, 'danger')
          this.user.resetarUsuario()
        }
      }, async () => {
        await this.helper.closeLoader()
        this.helper.message('Erro ao verificar token, por favor faça login novamente', 3000, 'danger')
        this.user.resetarUsuario()
      })
    }
  }

  async doLogin() {
    if (!this.email || !this.password) return await this.helper.message('Digite email e senha, por favor...', 3000, 'warning')
    await this.helper.loader('Tentando acesso...')
    this.api.postLogin({email: this.email, password: this.password}).subscribe(async (res: any) => {
      await this.helper.closeLoader()
      if(res.status) {
        this.user.setToken(res.token)
        this.helper.goToPage('/home')
        return
      }
      await this.helper.message('Erro ao fazer login, tente novamente', 3000, 'danger')
    }, async () => {
      await this.helper.closeLoader()
      await this.helper.message('Erro ao fazer login, tente novamente', 3000, 'danger')
    })
  }

  goRegister() {
    this.helper.goToPage('/register')
  }

}
