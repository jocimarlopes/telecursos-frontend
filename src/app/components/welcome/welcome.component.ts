import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { HelperService } from 'src/app/services/helper.service';
import { PixelTrackerService } from 'src/app/services/pixel-tracker.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: false
})
export class WelcomeComponent  implements OnInit {

  constructor(
    private helper: HelperService,
    private modal: ModalController,
    private tracking: PixelTrackerService
  ) { }

  ngOnInit() {

  }

  register() {
    this.tracking.onRegister()
    this.helper.goToPage('register')
    this.close()
  }

  close(){
    localStorage.setItem('welcome', 'true')
    this.modal.dismiss()
  }

}
