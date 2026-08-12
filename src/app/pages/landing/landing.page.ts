import { Component, OnInit } from '@angular/core';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';

/**
 * Porta de entrada do domínio principal.
 *
 * Antes a rota "" era o formulário de login. Quem já tem sessão vai direto
 * para o catálogo; quem não tem entende primeiro o que a plataforma faz.
 */
@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: false,
})
export class LandingPage implements OnInit {

  code = '';

  constructor(private helper: HelperService, private user: UserService) { }

  ngOnInit() {
    const token = this.user.getToken();
    if (token && this.helper.tokenIsValid(token)) {
      this.helper.goToPage('/home');
    }
  }

  go(route: string) {
    this.helper.goToPage(route);
  }

  validate() {
    const clean = this.code.trim();
    this.helper.goToPage(clean ? `/validar/${clean}` : '/validar');
  }
}
