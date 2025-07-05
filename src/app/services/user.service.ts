import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HelperService } from './helper.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userDataSubject = new BehaviorSubject<string | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userCredentials = new BehaviorSubject<any>(null)
  private isCertificado = new BehaviorSubject<boolean>(true);

  userData$: Observable<any> = this.userDataSubject.asObservable();
  token$: Observable<string | null> = this.tokenSubject.asObservable();
  userCredentials$: Observable<any> = this.userCredentials.asObservable();
  isCertificado$: Observable<boolean> = this.isCertificado.asObservable();

  constructor(private helper: HelperService) {}

  private setUserData(data: any) {
    this.userDataSubject.next(data);
  }

  public setCertified(isCertified: boolean) {
    this.isCertificado.next(isCertified);
  }

  setToken(token: string) {
    this.tokenSubject.next(token);
    localStorage.setItem('token', token);
    const decoded: any = this.helper.decodeJwt(token);
    if (decoded) {
      this.setUserData(decoded.data);
    }
  }

  getToken() {
    return this.tokenSubject.getValue();
  }

  getCredentials() {
    return this.userCredentials.getValue();
  }
  setCredentials(credentials: any) {
    return this.userCredentials.next(credentials)
  }

  getUserData() {
    return this.userDataSubject.getValue();
  }

  resetarUsuario() {
    this.userDataSubject.next(null);
    this.tokenSubject.next(null);
    localStorage.clear()
    this.helper.message('Fazendo logout...', 2000, 'warning')
    this.helper.goToPage('')
  }
}
