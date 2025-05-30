import { Component, OnInit, ViewChild } from '@angular/core';
import { InfiniteScrollCustomEvent, IonContent, ModalController } from '@ionic/angular';
import { CourseDetailsComponent } from 'src/app/components/course-details/course-details.component';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { PixelTrackerService } from 'src/app/services/pixel-tracker.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;

  lista: any[] = []
  nextPage: string = '1'
  isSearching: boolean = false
  searchSubs: any = null
  isLoading: boolean = false

  isPremium: boolean = false
  width: number = window.innerWidth

  constructor(
    private api: ApiService,
    private helper: HelperService,
    private user: UserService,
    private modal: ModalController,
    private tracking: PixelTrackerService
  ) { }

  ngOnInit() {
    this.verifyWidth()
    this.verifyUser()
    this.getCourses();
  }

  verifyUser() {
    this.user.userData$.subscribe(data => {
      if(data) {
        this.isPremium = !!parseInt(data.premium)
      }
    })
  }

  verifyWidth() {
    this.helper.screenWidth$.subscribe(data => this.width = data)
  }

  getCourses(event?: any) {
    this.isSearching = false
    const token = this.user.getToken()
    if (!token) return this.user.resetarUsuario()
    this.isLoading = true
    this.api.postWithToken('latest', {}, token).subscribe((data: any) => {
      this.isLoading = false
      this.nextPage = data.data.page
      this.lista = data.data.data
      if(event) (event.target as HTMLIonRefresherElement).complete();
    }, () => {
      this.isLoading = false
      if(event) (event.target as HTMLIonRefresherElement).complete();
    })
  }

  getCoursesByPage(page: string) {
    this.isSearching = false
    const token = this.user.getToken()
    if (!token) return this.user.resetarUsuario()
    this.isLoading = true
    this.api.postWithToken('latest', {page: page}, token).subscribe((data: any) => {
      this.isLoading = false
      this.nextPage = data.data.page
      this.lista = [...this.lista, ...data.data.data]
    }, () => this.isLoading = false)
  }

  getCoursesBySearch(search: string) {
    const token = this.user.getToken()
    if (!token) return this.user.resetarUsuario()
    this.isLoading = true
    this.searchSubs = this.api.postWithToken('latest', {search: search}, token).subscribe((data: any) => {
      this.isLoading = false
      this.nextPage = '1'
      this.lista = data.data
      if(data.data.length) {
        this.tracking.onSearch(search, this.lista[0].title || 'Curso Profissionalizante');
      }
    }, () => this.isLoading = false)
  }

  async getCourseInfos(localCourse: any) {    
    const token = this.user.getToken()
    if (!token) return this.user.resetarUsuario()
    this.isLoading = true
    await this.helper.loader('Carregando informações do curso...')
    this.searchSubs = this.api.postWithToken('latest', {link: localCourse.link, name: localCourse.title}, token).subscribe(async (data: any) => {
      await this.helper.closeLoader()
      this.isLoading = false
      const infos = {...data.data, image: localCourse.image}
      this.openModalCourseDetails(infos);
    }, async () => {
      await this.helper.closeLoader()
      this.isLoading = false
    })
  }

  async openModalCourseDetails(details: any) {
    const modal = await this.modal.create({
      component: CourseDetailsComponent,
      componentProps: {
        details: details,
        isPremium: this.isPremium
      }
    });
    await modal.present();
  }

  async handleRefresh(event: CustomEvent) {
    this.getCourses(event)
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    this.getCoursesByPage(this.nextPage)
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  handleInput(event: Event) {
    if(this.searchSubs) this.searchSubs.unsubscribe()
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value?.toLowerCase() || null;
    if(!query) return this.getCourses()
    this.getCoursesBySearch(query)
  }

  scrollToTop() {
    this.content.scrollToTop(400); // 400ms para fazer a animação suave
  }

  goToProfile() {
    this.helper.goToPage('/profile');
  }

}
