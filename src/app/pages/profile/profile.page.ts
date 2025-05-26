import { Component, OnInit } from '@angular/core';
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
    private userService: UserService
  ) { }

  ngOnInit() {
    this.getUser()
  }

  getUser() {
    this.user = this.userService.getUserData();
  }
}
