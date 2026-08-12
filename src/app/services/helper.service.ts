import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  private screenWidth = new BehaviorSubject<number>(window.innerWidth)
  
  screenWidth$: Observable<any> = this.screenWidth.asObservable();

  constructor(
    private loading: LoadingController,
    private toast: ToastController,
    private router: Router,
    private platform: Platform,
    private alert: AlertController,
    private location: Location,
  ) {
    this.verifyScreenWidth()
  }


  public async loader(message: string) {
    const loading = await this.loading.create({
      cssClass: 'loader',
      spinner: 'bubbles',
      message: message
    });
    await loading.present();
    return loading
  }

  public isIPhone(): boolean {
    return this.platform.is('ios')
  }

  /**
   * Fecha o loader. O `dismiss()` rejeita quando não há nenhum aberto, o que
   * derrubava o fluxo em qualquer caminho de erro que chamasse isso duas vezes.
   */
  async closeLoader() {
    try {
      await this.loading.dismiss()
    } catch {
      // nenhum loader aberto — nada a fazer
    }
  }

  // --- CPF -----------------------------------------------------------------

  public formatCpf(value: string): string {
    const digits = this.removeSpecialKeys(value || '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  /** Valida o CPF pelos dígitos verificadores (mesma regra do backend). */
  public isValidCpf(value: string): boolean {
    const cpf = this.removeSpecialKeys(value || '')
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

    for (const length of [9, 10]) {
      let total = 0
      for (let i = 0; i < length; i++) {
        total += parseInt(cpf[i], 10) * (length + 1 - i)
      }
      let check = (total * 10) % 11
      if (check === 10) check = 0
      if (check !== parseInt(cpf[length], 10)) return false
    }
    return true
  }

  // --- valores e datas -----------------------------------------------------

  public formatMoney(cents: number): string {
    return ((cents || 0) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  /** Formata uma data ISO vinda da API. */
  public formatDate(iso: string | null | undefined): string {
    if (!iso) return '—'
    const date = new Date(iso)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('pt-BR')
  }

  public formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—'
    const date = new Date(iso)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  /** "3 dias, 4h 12m" até a data informada; string vazia se já passou. */
  public countdownTo(iso: string | null | undefined): string {
    if (!iso) return ''
    const target = new Date(iso).getTime()
    const diff = target - Date.now()
    if (isNaN(target) || diff <= 0) return ''

    const totalSeconds = Math.floor(diff / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (days > 0) return `${days} ${days === 1 ? 'dia' : 'dias'} e ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes} min`
  }

  public async message(message: string, time: number, color: string) {
    const toast = await this.toast.create({
      message: message,
      duration: time,
      color: color,
    });
    toast.present();
  }

  /**
   * Navega para uma rota.
   *
   * O `skipLocationChange: true` que existia aqui impedia a URL da barra de
   * endereços de mudar: nenhuma tela tinha link próprio, o botão voltar do
   * navegador não funcionava e recarregar a página jogava o usuário de volta
   * ao login. Com telas no lugar dos modais, isso passou a ser essencial.
   */
  public async goToPage(route: string, extras?: NavigationExtras) {
    await this.router.navigate([route], extras);
  }

  public async goBack(fallback: string = '/home') {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    await this.goToPage(fallback);
  }

  public async disableLoader() {
    await this.loading.dismiss()
  }

  public specialKeysFilter(username: string) {
    const specialChars = /[` !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    return specialChars.test(username)
  }

  public verifyEmail(email: string) {
    const regex = new RegExp("[-A-Za-z0-9!#$%&'*+/=?^_`{|}~]+(?:\.[-A-Za-z0-9!#$%&'*+/=?^_`{|}~]+)*@(?:[A-Za-z0-9](?:[-A-Za-z0-9]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[-A-Za-z0-9]*[A-Za-z0-9])?")
    return regex.test(email)
  }

  public copyToClipboard(valor: string, message?: string, time?: number) {
    navigator.clipboard.writeText(valor).then(() => {
      this.message(message ? message : 'copiado p/ clipboard', time ? time : 1000, 'success')
    })
  }

  public addZeroToDateNumber(time: number) {
    return `${time}`.length < 2 ? `0${time}` : time
  }

  public epochToStringDate(timestamp: string) {
    const date = new Date(parseInt(timestamp) * 1000)
    return `${this.addZeroToDateNumber(date.getDate())}/${this.addZeroToDateNumber(date.getMonth() + 1)}/${this.addZeroToDateNumber(date.getFullYear())}`
  }

  public redirect_blank(url: string) {
    var a = document.createElement('a');
    a.target = "_blank";
    a.href = url;
    a.click();
  }

  public decodeJwt(token: string) {
    const decoded = jwtDecode(token);
    return decoded
  }

  public tokenIsValid(token: string) {
    const data: any = this.decodeJwt(token)
    const expires = (data.exp * 1000) - Date.now()
    if (!expires || isNaN(expires) || expires < 1) return false
    if (!data['data']['uid']) return false
    return true

  }

  public async alerta(header: string, subHeader: string, message: string, buttons: any[]) {
    const alert = await this.alert.create({
      header: header,
      subHeader: subHeader,
      message: message,
      buttons: buttons,
    });
    await alert.present();
  }

  removeSpecialKeys(texto: string) {
    return texto.replace(/\D/g, '')
  }

  // async showPopover(titulo: string, mensagem: string) {
  //   const popover = await this.popover.create({
  //     component: MessagePopoverComponent,
  //     componentProps: {
  //       titulo: titulo,
  //       mensagem: mensagem
  //     }
  //   })
  //   await popover.present()
  // }



  setScreenWidth(width: number) {
    this.screenWidth.next(width)
  }

  verifyScreenWidth() {
    window.addEventListener('resize', () => {
      this.setScreenWidth(window.innerWidth)
    });
  }

}
