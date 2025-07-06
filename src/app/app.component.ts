import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from './services/api.service';
import { UserService } from './services/user.service';
import { HelperService } from './services/helper.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  certificado: string | null = null;
  waiting: boolean = false;
  constructor(
    private actRoute: ActivatedRoute,
    private api: ApiService,
    private user: UserService,
    private helper: HelperService
    
  ) {
    this.getCertifiedParam()
  }

  verifyCertified() {
    setTimeout(() => {
      if(!this.certificado) this.user.setCertified(false);
    }, 1500);
  }

  getCertifiedParam() {
    this.actRoute.queryParams.subscribe(async params => {
      if (params['c']) {
        this.user.setCertified(true);
        this.waiting = true;
        await this.helper.loader('Verificando autenticidade do certificado...')
        this.api.postWithoutTokenBlob('validate', { code: params['c'] }).subscribe({
          next: async (data: any) => {
            this.verifyCertified()
            this.waiting = false;
            await this.helper.closeLoader()
            const url = URL.createObjectURL(data);
            this.certificado = url;            
            this.helper.message('Certificado verificado com sucesso!', 5000, 'success');
          },
          error: async (err) => { 
            this.verifyCertified()
            this.waiting = false;
            await this.helper.closeLoader() 
            console.error('Erro ao obter certificado:', err);
          }
        });
      }
    });
  }

}
