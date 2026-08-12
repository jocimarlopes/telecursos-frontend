import { Component } from '@angular/core';
import { HelperService } from 'src/app/services/helper.service';

/**
 * Recuperação de senha.
 *
 * O envio de e-mail está desligado no backend (o bloco flask-mail está
 * comentado em app.py), então a tela é honesta sobre isso em vez de fingir que
 * enviou algo — o botão anterior ficava apenas desabilitado, sem explicação.
 */
@Component({
  selector: 'app-recovery',
  templateUrl: './recovery.page.html',
  styleUrls: ['./recovery.page.scss'],
  standalone: false,
})
export class RecoveryPage {
  constructor(private helper: HelperService) { }

  goLogin() {
    this.helper.goToPage('/entrar');
  }
}
