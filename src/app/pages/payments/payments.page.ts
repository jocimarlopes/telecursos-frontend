import { Component, OnInit } from '@angular/core';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
  standalone: false
})
export class PaymentsPage implements OnInit {
  isPremium: boolean = false;
  premiumSince: string = '';
  width: number = window.innerWidth;

  constructor(
    private user: UserService,
    private helper: HelperService
  ) { }

  ngOnInit() {
    // Simulando estado premium
    this.premiumSince = '15/03/2024';
    this.verifyUser()
    this.verifyWidth()
  }

  verifyUser() {
    this.user.userData$.subscribe(data => {
      if(data) {
        this.isPremium = !!parseInt(data.premium)
        this.premiumSince = data.created_at || '--/--/--';
      }
    })
  }

  verifyWidth() {
    this.helper.screenWidth$.subscribe(data => this.width = data)
  }

  goToHome() {
    this.helper.goToPage('/home');
  }

  goToProfile() {
    this.helper.goToPage('/profile');
  }
  
  goBack() {
    this.helper.goToPage('/home')
  }

}
