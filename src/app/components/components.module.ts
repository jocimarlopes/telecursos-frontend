import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseDetailsComponent } from './course-details/course-details.component';
import { IonicModule } from '@ionic/angular';



@NgModule({
  declarations: [
    CourseDetailsComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    CourseDetailsComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA,
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class ComponentsModule { }
