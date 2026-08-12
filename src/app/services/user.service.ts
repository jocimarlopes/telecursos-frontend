import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HelperService } from './helper.service';

export interface Subscription {
  plan: 'lifetime' | 'monthly' | null;
  active: boolean;
  until: string | null;
  days_left: number | null;
  can_renew: boolean;
  expired: boolean;
}

export interface UserData {
  uid: string;
  email: string;
  name: string;
  lastname: string;
  cpf?: string;
  phone?: string;
  role: 'student' | 'admin';
  premium: number;
  premium_plan?: 'lifetime' | 'monthly' | null;
  premium_until?: string | null;
  subscription?: Subscription;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  userData$: Observable<UserData | null> = this.userDataSubject.asObservable();
  token$: Observable<string | null> = this.tokenSubject.asObservable();

  constructor(private helper: HelperService) {
    // Restaura a sessão salva antes de qualquer tela consultar o token.
    // Sem isso, um F5 numa rota interna começava sem token e derrubava o
    // usuário para o login mesmo com sessão válida.
    const stored = localStorage.getItem('token');
    if (stored && this.helper.tokenIsValid(stored)) {
      this.setToken(stored);
    }
  }

  setToken(token: string) {
    this.tokenSubject.next(token);
    localStorage.setItem('token', token);
    const decoded: any = this.helper.decodeJwt(token);
    if (decoded?.data) this.userDataSubject.next(decoded.data);
  }

  getToken(): string | null {
    return this.tokenSubject.getValue() ?? localStorage.getItem('token');
  }

  getUserData(): UserData | null {
    return this.userDataSubject.getValue();
  }

  /**
   * Tem acesso agora?
   *
   * Calculado a partir da validade, e não da flag `premium` do token: o JWT
   * dura 24h, então quem estivesse com a sessão aberta na hora do vencimento
   * continuaria vendo os cursos liberados na interface.
   */
  get isPremium(): boolean {
    const user = this.getUserData();
    if (!user) return false;
    if (user.premium_plan === 'lifetime') return true;
    if (user.premium_until) return new Date(user.premium_until).getTime() > Date.now();
    return !!Number(user.premium ?? 0);
  }

  get subscription(): Subscription | null {
    return this.getUserData()?.subscription ?? null;
  }

  get isLifetime(): boolean {
    return this.getUserData()?.premium_plan === 'lifetime';
  }

  /** Dias restantes; null em vitalício ou sem assinatura. */
  get daysLeft(): number | null {
    const until = this.getUserData()?.premium_until;
    if (!until || this.isLifetime) return null;
    const diff = new Date(until).getTime() - Date.now();
    return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
  }

  get isAdmin(): boolean {
    return this.getUserData()?.role === 'admin';
  }

  /** Limpa a sessão sem navegar — usado pelos guards, que já redirecionam. */
  clearSession() {
    this.userDataSubject.next(null);
    this.tokenSubject.next(null);
    localStorage.removeItem('token');
    localStorage.removeItem('pix');
  }

  logout() {
    this.clearSession();
    this.helper.message('Você saiu da sua conta', 2000, 'medium');
    this.helper.goToPage('/entrar');
  }
}
