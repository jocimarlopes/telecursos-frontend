import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserData, UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {

  user: UserData | null = null;

  editing = false;
  form = { name: '', lastname: '', phone: '', cpf: '' };
  saving = false;
  error = '';

  constructor(
    public helper: HelperService,
    private users: UserService,
    private api: ApiService,
  ) { }

  ngOnInit() {
    this.users.userData$.subscribe(data => {
      this.user = data;
      if (data) this.resetForm();
    });
  }

  get initials(): string {
    const first = this.user?.name?.[0] ?? '';
    const last = this.user?.lastname?.[0] ?? '';
    return (first + last).toUpperCase() || '?';
  }

  private resetForm() {
    this.form = {
      name: this.user?.name ?? '',
      lastname: this.user?.lastname ?? '',
      phone: this.user?.phone ?? '',
      cpf: this.helper.formatCpf(this.user?.cpf ?? ''),
    };
  }

  startEdit() {
    this.resetForm();
    this.error = '';
    this.editing = true;
  }

  cancelEdit() {
    this.editing = false;
    this.error = '';
  }

  onCpfInput(event: any) {
    this.form.cpf = this.helper.formatCpf(event.target.value || '');
  }

  save() {
    if (!this.form.name.trim() || !this.form.lastname.trim()) {
      this.error = 'Nome e sobrenome são obrigatórios.';
      return;
    }
    // O CPF é opcional aqui, mas se preenchido tem de ser válido — ele vai
    // para o Mercado Pago no próximo pagamento.
    if (this.form.cpf && !this.helper.isValidCpf(this.form.cpf)) {
      this.error = 'CPF inválido. Confira os números.';
      return;
    }

    this.error = '';
    this.saving = true;
    this.api.put('api/me', this.form, this.users.getToken()).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.editing = false;
        if (res.token) this.users.setToken(res.token);
        this.helper.message('Perfil atualizado', 2500, 'success');
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Não foi possível salvar.';
      },
    });
  }

  async logout() {
    await this.helper.alerta('Sair da conta?', '', 'Você precisará entrar novamente.', [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Sair', role: 'destructive', handler: () => this.users.logout() },
    ]);
  }

  go(route: string) {
    this.helper.goToPage(route);
  }

  get isAdmin(): boolean {
    return this.users.isAdmin;
  }

  get isPremium(): boolean {
    return this.users.isPremium;
  }

  get isLifetime(): boolean {
    return this.users.isLifetime;
  }

  get daysLeft(): number | null {
    return this.users.daysLeft;
  }

  get subscription() {
    return this.users.subscription;
  }
}
