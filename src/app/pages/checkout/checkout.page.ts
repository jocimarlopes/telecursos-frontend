import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';
import { MercadoPagoService } from 'src/app/services/mercadopago.service';

type Method = 'pix' | 'card' | 'wallet';
type Kind = 'certificate' | 'premium' | 'credit_topup';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: false,
})
export class CheckoutPage implements OnInit, OnDestroy {

  method: Method = 'pix';
  kind: Kind = 'premium';

  /** Preenchido quando a compra é de um certificado avulso. */
  certificateUid: string | null = null;

  /** Valor escolhido pela pessoa numa recarga — o backend confere o piso/teto. */
  topupAmountCents = 0;

  /** Saldo atual, para oferecer "pagar com saldo" quando ele cobrir o valor. */
  walletBalanceCents = 0;
  payingWithWallet = false;

  cpf = '';
  cpfTouched = false;

  pix: any = null;
  pixPaymentUid: string | null = null;
  checkingPix = false;

  cardReady = false;
  installmentOptions: number[] = [1];
  installments = 1;

  submitting = false;
  error = '';

  /** Valor a pagar. Vem do servidor; 0 até a cotação chegar. */
  amountCents = 0;
  loadingQuote = true;

  // Campos do cartão. Ficam só na memória do componente e são trocados por um
  // token no navegador — o número nunca chega ao nosso backend.
  cardNumber = '';
  cardHolder = '';
  cardMonth = '';
  cardYear = '';
  cardCvv = '';

  private pollTimer: any;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public helper: HelperService,
    private user: UserService,
    private mp: MercadoPagoService,
  ) { }

  ngOnInit() {
    this.certificateUid = this.route.snapshot.queryParamMap.get('certificado');
    const kindParam = this.route.snapshot.queryParamMap.get('kind');
    if (this.certificateUid) this.kind = 'certificate';
    else if (kindParam === 'credit_topup') this.kind = 'credit_topup';
    else this.kind = 'premium';

    if (this.isTopup) {
      this.topupAmountCents = Number(this.route.snapshot.queryParamMap.get('amount')) || 0;
    } else {
      this.loadWallet();
    }

    this.loadQuote();
    this.cpf = this.helper.formatCpf(this.user.getUserData()?.cpf || '');
    this.restorePendingPix();
    this.prepareCard();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  /**
   * Pergunta ao servidor quanto custa o que está sendo pago.
   *
   * O valor NUNCA é decidido no app. Antes o checkout trazia o preço da
   * assinatura cravado e só pulava essa consulta quando era certificado —
   * então a tela mostrava R$ 49,00 numa compra de certificado até o Pix ser
   * gerado. Agora a mesma regra que cobra é a que informa o preço.
   */
  private loadQuote() {
    this.loadingQuote = true;
    const params = this.isCertificate
      ? `?kind=certificate&certificate_uid=${this.certificateUid}`
      : this.isTopup
        ? `?kind=credit_topup&amount_cents=${this.topupAmountCents}`
        : '?kind=premium';

    this.api.get(`api/payments/quote${params}`, this.user.getToken()).subscribe({
      next: (res: any) => {
        this.loadingQuote = false;
        this.amountCents = res.amount_cents ?? 0;
        this.installmentOptions = this.mp.installmentOptions(this.amountCents);
        if (this.canPayWithWallet) this.method = 'wallet';
      },
      error: (err) => {
        this.loadingQuote = false;
        this.error = err?.error?.message
          || 'Não foi possível carregar o valor. Recarregue a página.';
      },
    });
  }

  /** Saldo consultado sempre fresco — mostra "pagar com saldo" quando cobrir
   * o valor. Não faz sentido perguntar pra uma recarga (ela existe para
   * ABASTECER o saldo, não para ser paga por ele). */
  private loadWallet() {
    this.api.get('api/wallet', this.user.getToken()).subscribe({
      next: (res: any) => {
        this.walletBalanceCents = res.balance_cents ?? 0;
        if (this.canPayWithWallet) this.method = 'wallet';
      },
      error: () => { this.walletBalanceCents = 0; },
    });
  }

  get isCertificate(): boolean {
    return !!this.certificateUid;
  }

  get isTopup(): boolean {
    return this.kind === 'credit_topup';
  }

  get canPayWithWallet(): boolean {
    return !this.isTopup && this.amountCents > 0 && this.walletBalanceCents >= this.amountCents;
  }

  /** Corpo comum a pix, cartão e saldo — o que muda é só a forma de cobrar. */
  private purchaseBody(): any {
    const purchase: any = { kind: this.kind };
    if (this.isCertificate) purchase.certificate_uid = this.certificateUid;
    if (this.isTopup) purchase.amount_cents = this.topupAmountCents;
    return purchase;
  }

  /** Bloqueia o checkout só quando não há nada a pagar agora. */
  get accessBlocked(): boolean {
    if (this.isCertificate || this.isTopup) return false;
    if (this.user.isLifetime) return true;
    return this.user.isPremium && !(this.subscription?.can_renew ?? true);
  }

  get subscription() {
    return this.user.subscription;
  }

  get isLifetime(): boolean {
    return this.user.isLifetime;
  }

  get daysLeft(): number | null {
    return this.user.daysLeft;
  }

  /** Renovando enquanto ainda há dias válidos. */
  get isRenewal(): boolean {
    return !this.isCertificate && this.user.isPremium;
  }

  get cpfValid(): boolean {
    return this.helper.isValidCpf(this.cpf);
  }

  get cpfError(): string {
    if (!this.cpfTouched || this.cpfValid) return '';
    return this.cpf ? 'CPF inválido. Confira os números.' : 'Informe seu CPF.';
  }

  onCpfInput(event: any) {
    this.cpf = this.helper.formatCpf(event.target.value || '');
  }

  // --- Pix -------------------------------------------------------------------

  /**
   * Um Pix gerado e não pago continua válido ao voltar para a tela. Guardamos
   * só na sessão: o localStorage anterior fazia o Pix sobreviver ao logout e
   * reaparecer para outro usuário no mesmo navegador.
   */
  private restorePendingPix() {
    const stored = sessionStorage.getItem('pix');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      this.pix = parsed.pix;
      this.pixPaymentUid = parsed.payment_uid;
      this.startPolling();
    } catch {
      sessionStorage.removeItem('pix');
    }
  }

  generatePix() {
    this.cpfTouched = true;
    if (!this.cpfValid) return;

    this.error = '';
    this.submitting = true;
    this.api.post('api/payments/pix', {
      cpf: this.cpf,
      ...this.purchaseBody(),
    }, this.user.getToken()).subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.pix = res.pix;
        this.pixPaymentUid = res.payment_uid;
        this.amountCents = res.pix.amount_cents ?? this.amountCents;
        sessionStorage.setItem('pix', JSON.stringify({
          pix: this.pix, payment_uid: this.pixPaymentUid,
        }));
        this.startPolling();
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message || 'Não foi possível gerar o Pix.';
      },
    });
  }

  copyPix() {
    this.helper.copyToClipboard(this.pix.clipboard, 'Código Pix copiado', 2000);
  }

  /**
   * Confere o pagamento periodicamente enquanto a tela estiver aberta, para
   * que o acesso libere sozinho quando o Pix cair. O botão manual continua
   * disponível — antes ele era a única forma de o pagamento ser reconhecido.
   */
  private startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => this.checkPix(true), 8000);
  }

  private stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  checkPix(silent = false) {
    if (!this.pixPaymentUid || this.checkingPix) return;
    this.checkingPix = true;

    this.api.get(`api/payments/${this.pixPaymentUid}/status`, this.user.getToken())
      .subscribe({
        next: (res: any) => {
          this.checkingPix = false;
          if (res.approved) return this.onApproved(res);
          if (!silent) this.helper.message(res.message, 3000, 'warning');
        },
        error: () => {
          this.checkingPix = false;
          if (!silent) {
            this.helper.message('Não foi possível verificar agora.', 3000, 'danger');
          }
        },
      });
  }

  async resetPix() {
    await this.helper.alerta(
      'Descartar este Pix?',
      '',
      'O código atual deixa de valer. Se você já pagou, não gere outro — clique em "Já paguei".',
      [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Descartar',
          role: 'destructive',
          handler: () => {
            this.pix = null;
            this.pixPaymentUid = null;
            sessionStorage.removeItem('pix');
            this.stopPolling();
          },
        },
      ],
    );
  }

  // --- cartão ----------------------------------------------------------------

  private async prepareCard() {
    try {
      await this.mp.load();
      this.cardReady = true;
      if (this.amountCents) {
        this.installmentOptions = this.mp.installmentOptions(this.amountCents);
      }
    } catch {
      // Sem o SDK o Pix continua funcionando; a aba de cartão avisa.
      this.cardReady = false;
    }
  }

  async payWithCard(form: any) {
    this.cpfTouched = true;
    if (!this.cpfValid) return;

    this.error = '';
    this.submitting = true;

    try {
      const card = await this.mp.createCardToken({
        cardNumber: form.number,
        cardholderName: form.holder,
        cardExpirationMonth: form.month,
        cardExpirationYear: form.year,
        securityCode: form.cvv,
        identificationType: 'CPF',
        identificationNumber: this.helper.removeSpecialKeys(this.cpf),
      });

      this.api.post('api/payments/card', {
        token: card.token,
        payment_method_id: card.payment_method_id,
        installments: this.installments,
        cpf: this.cpf,
        ...this.purchaseBody(),
      }, this.user.getToken()).subscribe({
        next: (res: any) => {
          this.submitting = false;
          if (res.approved) return this.onApproved(res);
          this.error = res.message;
        },
        error: (err) => {
          this.submitting = false;
          this.error = err?.error?.message || 'Não foi possível processar o cartão.';
        },
      });
    } catch (e: any) {
      this.submitting = false;
      this.error = e?.message || 'Confira os dados do cartão.';
    }
  }

  // --- saldo -------------------------------------------------------------

  payWithWallet() {
    this.error = '';
    this.payingWithWallet = true;
    this.api.post('api/payments/wallet', this.purchaseBody(), this.user.getToken()).subscribe({
      next: (res: any) => {
        this.payingWithWallet = false;
        if (res.approved) return this.onApproved(res);
        this.error = res.message;
      },
      error: (err) => {
        this.payingWithWallet = false;
        this.error = err?.error?.message || 'Não foi possível pagar com o saldo.';
      },
    });
  }

  // --- conclusão -------------------------------------------------------------

  private onApproved(res: any) {
    this.stopPolling();
    sessionStorage.removeItem('pix');
    if (res.token) this.user.setToken(res.token);

    this.helper.message(this.isTopup ? 'Saldo adicionado!' : 'Pagamento aprovado!', 3000, 'success');
    this.helper.goToPage(
      this.isCertificate ? '/certificados' : this.isTopup ? '/perfil' : '/home');
  }
}
