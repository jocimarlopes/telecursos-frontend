import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {

  email?: string
  password?: string
  name?: string
  lastname?: string

  constructor(
    private helper: HelperService,
    private user: UserService,
    private api: ApiService
  ) { }

  ngOnInit() {
  }

  async doRegister() {
    if (!this.email || !this.password || !this.name || !this.lastname) return await this.helper.message('Preencha todos os campos, por favor...', 3000, 'warning')
    await this.helper.loader('Cadastrando...')
    const dados = {
      email: this.email,
      password: this.password,
      name: this.name,
      lastname: this.lastname
    }
    this.api.postWithoutToken('register', dados).subscribe(async (res: any) => {
      await this.helper.closeLoader()
      if(res.status) {
        await this.helper.message('Usuário cadastrado com sucesso', 3000, 'success')
        this.user.setCredentials({email: this.email, password: this.password})
        this.helper.goToPage('')
        return
      }
      this.helper.message('Erro ao cadastrar usuário, tente novamente', 3000, 'danger')
    }, async () => {
      this.helper.message('Erro ao cadastrar usuário, tente novamente', 3000, 'danger')
      await this.helper.closeLoader()
    })
  }

  goRegister() {
    this.helper.goToPage('/register')
  }

}
