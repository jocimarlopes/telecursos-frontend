import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

/**
 * Histórico de pagamentos.
 *
 * Não existia: a tela antiga de "payments" era só o checkout do Pix. Agora
 * cada linha diz o que foi comprado, quando, por qual forma e — no caso de
 * certificado avulso — dá acesso direto ao item adquirido.
 */
@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
  standalone: false,
})
export class PaymentsPage implements OnInit {

  payments: any[] = [];
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
    this.api.get('api/payments', this.user.getToken()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.payments = res.payments || [];
        event?.target?.complete();
      },
      error: () => {
        this.loading = false;
        this.failed = true;
        event?.target?.complete();
      },
    });
  }

  statusLabel(status: string): string {
    return {
      approved: 'Pago',
      pending: 'Aguardando pagamento',
      in_process: 'Em análise',
      rejected: 'Recusado',
      cancelled: 'Cancelado',
      refunded: 'Estornado',
    }[status] || status;
  }

  statusClass(status: string): string {
    if (status === 'approved') return 'tc-tag--issued';
    if (status === 'rejected' || status === 'cancelled') return 'tc-tag--failed';
    if (status === 'pending' || status === 'in_process') return 'tc-tag--waiting';
    return 'tc-tag--muted';
  }

  methodLabel(payment: any): string {
    if (payment.method === 'credit_card') {
      return payment.installments > 1
        ? `Cartão · ${payment.installments}x`
        : 'Cartão · à vista';
    }
    return 'Pix';
  }

  openCertificate(payment: any) {
    window.open(
      `${environment.API_URL}/api/certificates/${payment.item.verification_code}/pdf`,
      '_blank',
    );
  }

  resume(payment: any) {
    this.helper.goToPage('/assinar', {
      queryParams: payment.item_ref ? { certificado: payment.item_ref } : {},
    });
  }

  trackByUid(_: number, payment: any) {
    return payment.uid;
  }
}
