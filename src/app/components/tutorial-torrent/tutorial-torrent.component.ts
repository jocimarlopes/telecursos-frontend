import { Component, OnInit } from '@angular/core';
import { Platform, PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-tutorial-torrent',
  templateUrl: './tutorial-torrent.component.html',
  styleUrls: ['./tutorial-torrent.component.scss'],
  standalone: false
})
export class TutorialTorrentComponent  implements OnInit {

  constructor(private platform: Platform, private popover: PopoverController) { }

  ngOnInit() {}

  abrirLink() {
    let url = 'https://www.utorrent.com/';
    if (this.platform.is('android')) {
      url = 'https://play.google.com/store/apps/details?id=com.utorrent.client';
    } else {
      url = 'https://www.utorrent.com/utorrent-classic/';
    }
    window.open(url, '_blank');
  }


  close() {
    this.popover.dismiss();
  }

}
