import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {

  email = '';
  password = '';
  showPassword = false;
  submitting = false;
  error = '';

  constructor(
    private helper: HelperService,
    private user: UserService,
    private api: ApiService,
  ) { }

  ngOnInit() {
    this.resumeSession();
  }

  /**
   * Renova a sessão de quem já estava logado.
   *
   * A versão anterior guardava e-mail e SENHA em texto puro no localStorage
   * para preencher o formulário. Qualquer script na página conseguia lê-los.
   * O token renovável já resolve a conveniência de não relogar.
   */
  private resumeSession() {
    const token = localStorage.getItem('token');
    if (!token || !this.helper.tokenIsValid(token)) return;

    this.submitting = true;
    this.api.refreshToken(token).subscribe({
      next: (res: any) => {
        this.submitting = false;
        if (res?.status) {
          this.user.setToken(res.token);
          this.helper.goToPage('/home');
        }
      },
      error: () => { this.submitting = false; },
    });
  }

  async doLogin() {
    this.error = '';

    if (!this.email.trim() || !this.password) {
      this.error = 'Preencha e-mail e senha.';
      return;
    }
    if (!this.helper.verifyEmail(this.email.trim())) {
      this.error = 'Digite um e-mail válido.';
      return;
    }

    this.submitting = true;
    this.api.login(this.email.trim(), this.password).subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.user.setToken(res.token);
        this.helper.goToPage('/home');
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message || 'Não foi possível entrar. Tente novamente.';
      },
    });
  }

  goRegister() {
    this.helper.goToPage('/cadastrar');
  }
}
