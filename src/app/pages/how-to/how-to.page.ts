import { Component } from '@angular/core';
import { HelperService } from 'src/app/services/helper.service';

/** Era um popover; virou tela para poder ser linkada de qualquer lugar. */
@Component({
  selector: 'app-how-to',
  templateUrl: './how-to.page.html',
  styleUrls: ['./how-to.page.scss'],
  standalone: false,
})
export class HowToPage {

  constructor(private helper: HelperService) { }

  openUtorrent() {
    this.helper.redirect_blank('https://www.utorrent.com/downloads');
  }
}
