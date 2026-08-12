import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AdminGuardService, AuthGuardService } from './services/auth-guard.service';

/**
 * Rotas em português e com URL própria para cada tela.
 *
 * Antes, telas centrais (detalhe do curso, boas-vindas, tutorial) eram modais
 * sem endereço: não davam para compartilhar, o botão voltar do navegador não
 * funcionava e um F5 perdia o contexto.
 *
 * Os caminhos antigos continuam respondendo, redirecionando para os novos, para
 * não quebrar links já compartilhados.
 */
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./pages/landing/landing.module').then(m => m.LandingPageModule),
  },

  // --- público ---------------------------------------------------------------
  {
    path: 'entrar',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule),
  },
  {
    path: 'cadastrar',
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule),
  },
  {
    path: 'recuperar',
    loadChildren: () => import('./pages/recovery/recovery.module').then(m => m.RecoveryPageModule),
  },
  {
    path: 'bem-vindo',
    loadChildren: () => import('./pages/welcome/welcome.module').then(m => m.WelcomePageModule),
  },
  {
    path: 'validar',
    loadChildren: () => import('./pages/validate/validate.module').then(m => m.ValidatePageModule),
  },
  {
    path: 'validar/:codigo',
    loadChildren: () => import('./pages/validate/validate.module').then(m => m.ValidatePageModule),
  },
  {
    path: 'como-acessar',
    loadChildren: () => import('./pages/how-to/how-to.module').then(m => m.HowToPageModule),
  },

  // --- aluno -----------------------------------------------------------------
  {
    path: 'home',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule),
  },
  {
    path: 'curso/:ref',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./pages/course/course.module').then(m => m.CoursePageModule),
  },
  {
    path: 'meus-cursos',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./pages/my-courses/my-courses.module').then(m => m.MyCoursesPageModule),
  },
  {
    path: 'certificados',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./pages/certificates/certificates.module').then(m => m.CertificatesPageModule),
  },
  {
    path: 'certificados/emitir/:cursoUid',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./pages/issue-certificate/issue-certificate.module').then(m => m.IssueCertificatePageModule),
  },
  {
    path: 'assinar',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./pages/checkout/checkout.module').then(m => m.CheckoutPageModule),
  },
  {
    path: 'pagamentos',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./pages/payments/payments.module').then(m => m.PaymentsPageModule),
  },
  {
    path: 'perfil',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfilePageModule),
  },

  // --- admin -----------------------------------------------------------------
  {
    path: 'admin',
    canActivate: [AdminGuardService],
    loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminPageModule),
  },

  // --- compatibilidade com as URLs antigas ------------------------------------
  { path: 'login', redirectTo: 'entrar' },
  { path: 'register', redirectTo: 'cadastrar' },
  { path: 'recovery', redirectTo: 'recuperar' },
  { path: 'payments', redirectTo: 'assinar' },
  { path: 'my-courses', redirectTo: 'meus-cursos' },
  { path: 'profile', redirectTo: 'perfil' },
  { path: 'tutorials', redirectTo: 'como-acessar' },

  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
