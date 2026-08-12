import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { HelperService } from './helper.service';
import { UserService } from './user.service';

/**
 * Guarda das rotas autenticadas.
 *
 * Corrige dois problemas da versão anterior:
 *
 * 1. Checava `token_data['data']['id']`, mas o backend sempre devolveu `uid`.
 *    A condição nunca era satisfeita — o guard reprovaria qualquer usuário.
 *    Passava despercebido porque não estava registrado em nenhuma rota.
 * 2. Não estava aplicado. As páginas internas eram acessíveis sem login;
 *    quebravam ao chamar a API, mas ficavam visíveis.
 */
@Injectable({ providedIn: 'root' })
export class AuthGuardService implements CanActivate {

  constructor(
    private helper: HelperService,
    private user: UserService,
    private router: Router,
  ) { }

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');

    if (!token) {
      return this.reject('Faça login para continuar');
    }

    if (!this.helper.tokenIsValid(token)) {
      return this.reject('Sua sessão expirou. Entre novamente.');
    }

    return true;
  }

  private reject(message: string): UrlTree {
    this.user.clearSession();
    this.helper.message(message, 2400, 'warning');
    return this.router.parseUrl('/entrar');
  }
}

/** Restringe o painel administrativo a usuários com role de admin. */
@Injectable({ providedIn: 'root' })
export class AdminGuardService implements CanActivate {

  constructor(
    private helper: HelperService,
    private user: UserService,
    private router: Router,
    private authGuard: AuthGuardService,
  ) { }

  canActivate(): boolean | UrlTree {
    const authenticated = this.authGuard.canActivate();
    if (authenticated !== true) return authenticated;

    if (this.user.getUserData()?.role !== 'admin') {
      this.helper.message('Área restrita a administradores', 2400, 'danger');
      return this.router.parseUrl('/home');
    }
    return true;
  }
}
