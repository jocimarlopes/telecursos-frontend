import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { UserService } from './user.service';
import { HelperService } from './helper.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

  constructor(
    private helper: HelperService,
    private user: UserService
  ) { }

  // Verify if token is valid or expired
  canActivate(route?: ActivatedRouteSnapshot): Promise<boolean> {
    const token = localStorage.getItem('token')
    return this.verifyCanActivate(token, route)
  }

  async verifyCanActivate(token: string|null, route?: any) {
    if (!token) {
      this.goToLogin('Você não está logado, faça login para continuar')
      return false;
    }
    const token_data: any = jwtDecode(token)
    const expires = (token_data['exp'] * 1000) - Date.now()

    if(!token_data['data']['id']) {
      this.goToLogin('Erro de usuário, faça login novamente')
      return false
    }
    if (!expires || isNaN(expires) || expires < 1) {
      this.goToLogin('sua sessão expirou, faça login novamente')
      return false;
    }
    return true;
  }

  async goToLogin(message?: string) {
    this.user.resetarUsuario()
    if (message) this.helper.message(message, 2400, 'warning')
    this.helper.goToPage('')
  }



}
