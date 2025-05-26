import { Component, OnInit } from '@angular/core';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  user: any;

  constructor(
    private userService: UserService,
    private helper: HelperService
  ) { }

  ngOnInit() {
    this.getUser()
  }

  getUser() {
    this.user = this.userService.getUserData();
  }

  goBack() {
    this.helper.goToPage('/home')
  }

  formatDate(dateString: string): string {
    return this.helper.epochToStringDate(dateString)
  }

  logout() {
    this.userService.resetarUsuario()
    this.helper.goToPage('');
  }
}
