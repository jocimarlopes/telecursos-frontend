import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { HelperService } from 'src/app/services/helper.service';

@Component({
  selector: 'course-details',
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.scss'],
  standalone: false
})
export class CourseDetailsComponent  implements OnInit {

  @Input('details') details: any = null;
  @Input('isPremium') isPremium: boolean = false;

  constructor(
    private modal: ModalController,
    private helper: HelperService
  ) { }

  ngOnInit() {
  }

  close() {
    this.modal.dismiss()
  }

  openLink(url: string) {
    if(url.includes('magnet:')) {
      window.open(url, '_blank');
    } else {
      this.modal.dismiss()
      this.helper.goToPage(url)
    }
  }
}
