import { Component, Input } from '@angular/core';

/**
 * Etiqueta com a situação do certificado de um curso.
 *
 * A carência de 7 dias saiu: o certificado é liberado na hora, mediante
 * pagamento. Sobraram três estados reais — emitido, aguardando pagamento e
 * disponível para comprar.
 */
@Component({
  selector: 'certificate-status',
  templateUrl: './certificate-status.component.html',
  standalone: false,
})
export class CertificateStatusComponent {

  /** Curso vindo de GET /api/my-courses. */
  @Input() course: any;

  get state(): 'issued' | 'pending-payment' | 'available' {
    if (this.course?.certificate_status === 'active') return 'issued';
    if (this.course?.certificate_status === 'pending_payment') return 'pending-payment';
    return 'available';
  }
}
