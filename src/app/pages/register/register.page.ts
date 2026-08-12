import { Component } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {

  name = '';
  lastname = '';
  email = '';
  password = '';
  confirm = '';
  showPassword = false;
  submitting = false;
  error = '';

  constructor(
    private helper: HelperService,
    private user: UserService,
    private api: ApiService,
  ) { }

  private validate(): string | null {
    if (!this.name.trim()) return 'Informe seu nome.';
    if (!this.lastname.trim()) return 'Informe seu sobrenome.';
    if (!this.helper.verifyEmail(this.email.trim())) return 'Digite um e-mail válido.';
    if (this.password.length < 6) return 'A senha precisa ter ao menos 6 caracteres.';
    if (this.password !== this.confirm) return 'As senhas não conferem.';
    return null;
  }

  doRegister() {
    this.error = this.validate() || '';
    if (this.error) return;

    this.submitting = true;
    this.api.post('register', {
      name: this.name.trim(),
      lastname: this.lastname.trim(),
      email: this.email.trim(),
      password: this.password,
    }).subscribe({
      next: (res: any) => {
        this.submitting = false;
        // O backend já devolve o token no cadastro — não faz sentido mandar
        // quem acabou de criar a conta digitar a senha de novo.
        this.user.setToken(res.token);
        this.helper.message('Conta criada. Bem-vindo!', 3000, 'success');
        this.helper.goToPage('/bem-vindo');
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message || 'Não foi possível criar a conta. Tente novamente.';
      },
    });
  }

  goLogin() {
    this.helper.goToPage('/entrar');
  }
}
