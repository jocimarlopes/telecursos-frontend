import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AppHeaderComponent } from './app-header/app-header.component';
import { CertificateStatusComponent } from './certificate-status/certificate-status.component';
import { CoverImageComponent } from './cover-image/cover-image.component';

/**
 * Componentes compartilhados.
 *
 * CourseDetailsComponent, WelcomeComponent e TutorialTorrentComponent saíram
 * daqui: viraram páginas com rota própria (/curso/:ref, /bem-vindo,
 * /como-acessar).
 */
@NgModule({
  declarations: [
    AppHeaderComponent,
    CertificateStatusComponent,
    CoverImageComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  exports: [
    AppHeaderComponent,
    CertificateStatusComponent,
    CoverImageComponent,
  ],
})
export class ComponentsModule { }
