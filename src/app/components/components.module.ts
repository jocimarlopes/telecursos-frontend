import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseDetailsComponent } from './course-details/course-details.component';
import { IonicModule } from '@ionic/angular';
import { WelcomeComponent } from './welcome/welcome.component';
import { TutorialTorrentComponent } from './tutorial-torrent/tutorial-torrent.component';



@NgModule({
  declarations: [
    CourseDetailsComponent,
    WelcomeComponent,
    TutorialTorrentComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    CourseDetailsComponent,
    WelcomeComponent,
    TutorialTorrentComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA,
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class ComponentsModule { }
