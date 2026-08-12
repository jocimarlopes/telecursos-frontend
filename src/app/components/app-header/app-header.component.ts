import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';

/**
 * Cabeçalho compartilhado.
 *
 * Antes cada página repetia a mesma toolbar com pequenas divergências — a de
 * perfil e a de pagamentos tinham botões desabilitados que não faziam nada.
 */
@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  standalone: false,
})
export class AppHeaderComponent {

  /** Mostra a seta de voltar em vez do menu de conta. */
  @Input() back = false;

  /** Rota usada quando não há histórico para voltar. */
  @Input() backTo = '/home';

  @Input() title = '';

  /** Esconde as ações de conta (telas públicas, como a validação). */
  @Input() bare = false;

  constructor(
    private helper: HelperService,
    private router: Router,
    public user: UserService,
  ) { }

  get onMyCourses(): boolean {
    return this.router.url.startsWith('/meus-cursos');
  }

  goHome() {
    this.helper.goToPage(this.user.getToken() ? '/home' : '/');
  }

  goBack() {
    this.helper.goBack(this.backTo);
  }

  goProfile() {
    this.helper.goToPage('/perfil');
  }

  goMyCourses() {
    this.helper.goToPage('/meus-cursos');
  }
}
