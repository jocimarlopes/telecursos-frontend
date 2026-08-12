import { Component, OnInit } from '@angular/core';
import { HelperService } from 'src/app/services/helper.service';
import { PixelTrackerService } from 'src/app/services/pixel-tracker.service';

/** Era um modal sem URL, aberto por cima do login. Virou uma tela de boas-vindas. */
@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: false,
})
export class WelcomePage implements OnInit {

  steps = [
    {
      icon: 'search-outline',
      title: 'Escolha o curso',
      text: 'Navegue pelo catálogo ou busque pelo tema que você precisa aprender.',
    },
    {
      icon: 'play-circle-outline',
      title: 'Estude no seu ritmo',
      text: 'Todos os cursos inclusos na assinatura, sem prazo para concluir.',
    },
    {
      icon: 'ribbon-outline',
      title: 'Emita o certificado',
      text: 'Na hora que quiser: escolha a instituição, pague e baixe.',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Comprove a autenticidade',
      text: 'Cada certificado tem código e QR Code que o empregador pode conferir.',
    },
  ];

  constructor(private helper: HelperService, private tracking: PixelTrackerService) { }

  ngOnInit() {
    this.tracking.onWelcome();
  }

  start() {
    this.helper.goToPage('/home');
  }
}
