import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
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

  async closeLoader() {
    this.loading.dismiss()
  }

  public async message(message: string, time: number, color: string) {
    const toast = await this.toast.create({
      message: message,
      duration: time,
      color: color,
    });
    toast.present();
  }

  public async goToPage(route: string) {
    await this.router.navigate([route], { skipLocationChange: true });
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
