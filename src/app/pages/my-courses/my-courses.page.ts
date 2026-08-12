import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

/**
 * Cursos que o aluno já acessou, com a situação do certificado de cada um.
 * A página existia apenas como scaffold do Ionic ("my-courses" na tela).
 */
@Component({
  selector: 'app-my-courses',
  templateUrl: './my-courses.page.html',
  styleUrls: ['./my-courses.page.scss'],
  standalone: false,
})
export class MyCoursesPage implements OnInit {

  courses: any[] = [];
  loading = true;
  failed = false;

  constructor(
    private api: ApiService,
    public helper: HelperService,
    private user: UserService,
  ) { }

  ngOnInit() {
    this.load();
  }

  load(event?: any) {
    this.loading = !event;
    this.failed = false;
    this.api.get('api/my-courses', this.user.getToken()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.courses = res.courses || [];
        event?.target?.complete();
      },
      error: () => {
        this.loading = false;
        this.failed = true;
        event?.target?.complete();
      },
    });
  }

  issue(course: any) {
    this.helper.goToPage(`/certificados/emitir/${course.uid}`);
  }

  download(course: any) {
    window.open(
      `${environment.API_URL}/api/certificates/${course.verification_code}/pdf`,
      '_blank',
    );
  }

  payPending(course: any) {
    this.helper.goToPage('/assinar', {
      queryParams: { certificado: course.certificate_uid },
    });
  }

  trackByUid(_: number, course: any) {
    return course.uid;
  }
}
