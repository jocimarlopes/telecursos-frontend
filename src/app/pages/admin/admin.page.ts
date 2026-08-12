import { Component, HostListener, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { HelperService } from 'src/app/services/helper.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

type Tab = 'institutions' | 'templates' | 'certificates' | 'payments' | 'users';

const FIELD_LABELS: Record<string, string> = {
  student_name: 'Nome do aluno',
  course_title: 'Nome do curso',
  workload: 'Carga horária',
  completed_at: 'Data de conclusão',
  institution_name: 'Instituição',
  verification_code: 'Código de verificação',
  issued_at: 'Data de emissão',
};

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
})
export class AdminPage implements OnInit {

  tab: Tab = 'institutions';
  loading = false;
  error = '';

  institutions: any[] = [];
  templates: any[] = [];
  certificates: any[] = [];
  payments: any[] = [];
  users: any[] = [];

  // --- formulário de instituição ---
  institutionForm: any = null;
  savingInstitution = false;

  // --- crédito de usuário ---
  creditForm: any = null;
  savingCredit = false;

  // --- editor de modelo ---
  templateForm: any = null;
  savingTemplate = false;
  selectedFieldIndex = -1;
  backgroundObjectUrl: string | null = null;

  readonly fieldLabels = FIELD_LABELS;
  readonly fieldKeys = Object.keys(FIELD_LABELS);

  constructor(
    private api: ApiService,
    public helper: HelperService,
    private user: UserService,
  ) { }

  ngOnInit() {
    this.switchTab('institutions');
  }

  private get token() {
    return this.user.getToken();
  }

  switchTab(tab: Tab) {
    this.tab = tab;
    this.error = '';
    this.loading = true;

    const routes: Record<Tab, string> = {
      institutions: 'api/admin/institutions',
      templates: 'api/admin/certificate-templates',
      certificates: 'api/admin/certificates',
      payments: 'api/admin/payments',
      users: 'api/admin/users',
    };

    this.api.get(routes[tab], this.token).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.institutions = res.institutions ?? this.institutions;
        this.templates = res.templates ?? this.templates;
        this.certificates = res.certificates ?? this.certificates;
        this.payments = res.payments ?? this.payments;
        this.users = res.users ?? this.users;
      },
      error: () => {
        this.loading = false;
        this.error = 'Não foi possível carregar os dados.';
      },
    });
  }

  // =========================================================================
  // instituições
  // =========================================================================

  newInstitution() {
    this.institutionForm = {
      uid: null, slug: '', name: '', legal_name: '', cnpj: '',
      primary_color: '#144BA6', secondary_color: '#0E1726',
      site_url: '', active: true,
    };
  }

  editInstitution(institution: any) {
    this.institutionForm = { ...institution };
  }

  saveInstitution() {
    this.error = '';
    this.savingInstitution = true;

    const form = this.institutionForm;
    const request = form.uid
      ? this.api.put(`api/admin/institutions/${form.uid}`, form, this.token)
      : this.api.post('api/admin/institutions', form, this.token);

    request.subscribe({
      next: (res: any) => {
        this.savingInstitution = false;
        if (!res.status) {
          this.error = (res.errors || []).join(' ');
          return;
        }
        this.institutionForm = null;
        this.helper.message('Instituição salva', 2500, 'success');
        this.switchTab('institutions');
      },
      error: (err) => {
        this.savingInstitution = false;
        this.error = (err?.error?.errors || []).join(' ')
          || err?.error?.message || 'Não foi possível salvar.';
      },
    });
  }

  async deleteInstitution(institution: any) {
    await this.helper.alerta(
      `Remover ${institution.name}?`, '',
      'Só é possível remover instituições que ainda não emitiram certificados.',
      [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover', role: 'destructive',
          handler: () => {
            this.api.delete(`api/admin/institutions/${institution.uid}`, this.token)
              .subscribe({
                next: (res: any) => {
                  if (!res.status) {
                    this.helper.message((res.errors || []).join(' '), 5000, 'danger');
                    return;
                  }
                  this.helper.message('Instituição removida', 2500, 'success');
                  this.switchTab('institutions');
                },
                error: () => this.helper.message('Não foi possível remover.', 3000, 'danger'),
              });
          },
        },
      ],
    );
  }

  uploadLogo(institution: any, event: any) {
    const file: File = event.target.files?.[0];
    if (!file) return;
    this.api.upload(`api/admin/institutions/${institution.uid}/logo`, 'logo', file, this.token)
      .subscribe({
        next: () => this.helper.message('Logo atualizado', 2500, 'success'),
        error: (err) => this.helper.message(
          err?.error?.message || 'Não foi possível enviar o logo.', 4000, 'danger'),
      });
  }

  // =========================================================================
  // modelos de certificado
  // =========================================================================

  newTemplate() {
    this.templateForm = {
      uid: null,
      institution_uid: this.institutions[0]?.uid ?? '',
      name: '',
      description: '',
      workload_hours: 40,
      price_cents: 1990,
      active: true,
      // Layout inicial equivalente ao modelo original — o admin arrasta daqui.
      layout: {
        canvas: { width: 1439, height: 1018 },
        fields: [
          { key: 'student_name', x: null, y: 390, align: 'center',
            font: 'Montserrat-Bold', size: 40, color: '#000000',
            transform: 'upper', max_width: 1150, shrink_to_fit: true,
            // Nome longo: encolhe, quebra em 2 linhas e só então abrevia os
            // nomes do meio. Sobrenome nunca é descartado.
            max_lines: 2, abbreviate_middle: true },
          { key: 'course_title', x: null, y: 540, align: 'center',
            font: 'Montserrat-Bold', size: 35, color: '#000000',
            max_width: 1150, shrink_to_fit: true, max_lines: 2 },
          { key: 'workload', x: 23, y: 603, align: 'center',
            font: 'Montserrat-Bold', size: 30, color: '#000000', format: '{value}' },
          { key: 'completed_at', x: 87, y: 703, align: 'center',
            font: 'Montserrat-Bold', size: 30, color: '#000000', format: 'spaced_date' },
        ],
        qrcode: { x: 20, y: -200, size: 180 },
      },
    };
    this.selectedFieldIndex = 0;
  }

  editTemplate(template: any) {
    this.loading = true;
    this.api.get(`api/admin/certificate-templates/${template.uid}`, this.token).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.templateForm = {
          ...res.template,
          institution_uid: res.template.institution_uid,
        };
        this.selectedFieldIndex = 0;
        this.loadBackground(template.uid);
      },
      error: () => {
        this.loading = false;
        this.error = 'Não foi possível carregar o modelo.';
      },
    });
  }

  /** Largura da arte na tela. Guardada para não consultar o DOM a cada ciclo. */
  canvasWidthPx = 0;

  /** Arrasto em andamento sobre a arte. */
  private drag: {
    field: any;
    startX: number;
    startY: number;
    originX: number | null;
    originY: number;
    moved: boolean;
  } | null = null;

  onBackgroundLoad(event: Event) {
    this.canvasWidthPx = (event.target as HTMLImageElement).clientWidth;
  }

  @HostListener('window:resize')
  onWindowResize() {
    const el = document.querySelector('.editor__canvas .editor__bg') as HTMLImageElement;
    this.canvasWidthPx = el?.clientWidth || this.canvasWidthPx;
  }

  private canvasPixelWidth(): number {
    if (!this.canvasWidthPx) this.onWindowResize();
    return this.canvasWidthPx;
  }

  /** Quantos pixels da ARTE equivalem a 1 pixel de tela. */
  private artPerScreenPixel(): number {
    const canvasW = this.templateForm?.layout?.canvas?.width;
    const shown = this.canvasPixelWidth();
    return canvasW && shown ? canvasW / shown : 1;
  }

  // =========================================================================
  // arrastar campos sobre a arte
  // =========================================================================

  /**
   * Começa a arrastar. Vale para campo de texto e para o QR Code.
   *
   * Pointer events cobrem mouse e toque com o mesmo código — no celular o
   * admin arrasta com o dedo sem precisar de nada extra.
   */
  startDrag(event: PointerEvent, field: any, index: number | null = null) {
    if (index !== null) this.selectField(index);

    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    event.preventDefault();

    this.drag = {
      field,
      startX: event.clientX,
      startY: event.clientY,
      originX: field.x ?? null,
      originY: field.y ?? 0,
      moved: false,
    };
  }

  @HostListener('document:pointermove', ['$event'])
  onDragMove(event: PointerEvent) {
    if (!this.drag) return;

    const scale = this.artPerScreenPixel();
    const dx = (event.clientX - this.drag.startX) * scale;
    const dy = (event.clientY - this.drag.startY) * scale;

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) this.drag.moved = true;

    // x nulo significa "centralizado": ao arrastar, vira deslocamento a partir
    // do centro, começando do zero.
    this.drag.field.x = Math.round((this.drag.originX ?? 0) + dx);

    // y negativo é medido a partir da base. O incremento é o mesmo nos dois
    // casos, então o sinal se preserva sozinho.
    this.drag.field.y = Math.round(this.drag.originY + dy);
  }

  @HostListener('document:pointerup')
  @HostListener('document:pointercancel')
  onDragEnd() {
    this.drag = null;
  }

  get isDragging(): boolean {
    return !!this.drag;
  }

  /** Devolve o campo para o centro horizontal (x = null). */
  centerField(field: any) {
    field.x = null;
  }

  /**
   * Corpo da fonte convertido de pixels-da-arte para pixels-de-tela.
   *
   * É isso que faltava no editor antigo: a etiqueta tinha tamanho fixo, então
   * um campo de corpo 78 e um de corpo 24 apareciam idênticos. Agora o que
   * está na tela tem a mesma proporção do que sai impresso.
   */
  previewFontSize(field: any): number {
    const canvasW = this.templateForm?.layout?.canvas?.width;
    const shown = this.canvasPixelWidth();
    if (!canvasW || !shown) return 12;
    return Math.max(5, (field.size || 30) * (shown / canvasW));
  }

  /** Texto de exemplo por campo — o mesmo que a prévia do backend usa. */
  private sampleFor(key: string): string {
    const samples: Record<string, string> = {
      student_name: 'Maria Aparecida da Conceição Nascimento',
      course_title: 'Curso de Eletricista Industrial: Comandos Elétricos',
      workload: String(this.templateForm?.workload_hours ?? 40),
      completed_at: '12/08/2026',
      institution_name: this.institutions
        .find(i => i.uid === this.templateForm?.institution_uid)?.name || 'Instituição',
      verification_code: 'ABCD-2345-EFGH',
      issued_at: '12/08/2026',
    };
    return samples[key] ?? key;
  }

  /**
   * Reproduz no editor a mesma cascata do backend (encolher → quebrar linha →
   * abreviar), para a prévia não prometer algo diferente do impresso.
   */
  previewLines(field: any): string[] {
    let text = this.sampleFor(field.key);

    if (field.format) {
      text = field.format === 'spaced_date'
        ? text.split('/').join('    ')
        : field.format.replace('{value}', text);
    }
    if (field.transform === 'upper') text = text.toUpperCase();
    else if (field.transform === 'lower') text = text.toLowerCase();

    const maxLines = Math.max(1, field.max_lines || 1);
    if (!field.max_width || !field.shrink_to_fit) return [text];

    // Estimativa de largura: sem medir no canvas, uma média de 0,58em por
    // caractere aproxima bem a Montserrat Bold. Serve para decidir a quebra.
    const charW = 0.58;
    const maxChars = Math.floor(field.max_width / ((field.size || 30) * charW));
    if (text.length <= maxChars) return [text];

    if (field.abbreviate_middle && field.key === 'student_name') {
      text = this.abbreviateMiddle(text);
      if (text.length <= maxChars) return [text];
    }
    if (maxLines === 1) return [text];

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const candidate = `${current} ${w}`.trim();
      if (candidate.length <= maxChars || !current) current = candidate;
      else { lines.push(current); current = w; }
    }
    if (current) lines.push(current);
    return lines.slice(0, maxLines);
  }

  /** Espelha services/certified_generator.py::abbreviate_name. */
  private abbreviateMiddle(fullName: string): string {
    const particles = new Set(['DE','DA','DO','DAS','DOS','E','DEL','DI','LA','VAN','VON']);
    const suffixes = new Set(['JUNIOR','JR','JÚNIOR','FILHO','NETO','SOBRINHO','SEGUNDO']);
    const words = fullName.split(/\s+/).filter(Boolean);
    if (words.length <= 2) return words.join(' ');

    let keepFromEnd = 1;
    if (suffixes.has(words[words.length - 1].toUpperCase().replace('.', '')) && words.length > 3) {
      keepFromEnd = 2;
    }
    const head = words[0];
    const middle = words.slice(1, -keepFromEnd);
    const tail = words.slice(-keepFromEnd);

    const abbreviated = middle.map(w =>
      particles.has(w.toUpperCase()) || w.length <= 2 ? w : `${w[0].toUpperCase()}.`);
    return [head, ...abbreviated, ...tail].join(' ');
  }

  get selectedField() {
    return this.templateForm?.layout?.fields?.[this.selectedFieldIndex] ?? null;
  }

  selectField(index: number) {
    this.selectedFieldIndex = index;
  }

  addField(key: string) {
    this.templateForm.layout.fields.push({
      key, x: null, y: 400, align: 'center',
      font: 'Montserrat-Bold', size: 30, color: '#000000',
      max_width: 1150, shrink_to_fit: true,
    });
    this.selectedFieldIndex = this.templateForm.layout.fields.length - 1;
  }

  removeField(index: number) {
    this.templateForm.layout.fields.splice(index, 1);
    this.selectedFieldIndex = Math.min(this.selectedFieldIndex,
      this.templateForm.layout.fields.length - 1);
  }

  /** Move o campo selecionado com as setas do teclado. */
  nudge(axis: 'x' | 'y', delta: number) {
    const field = this.selectedField;
    if (!field) return;
    field[axis] = (field[axis] ?? 0) + delta;
  }

  /**
   * Carrega a arte de fundo como blob.
   *
   * Um `<img src="...">` não consegue mandar o header `Token`, então apontar a
   * tag direto para a rota protegida devolvia 401 e o editor abria sem a arte.
   * Buscamos com o HttpClient e exibimos via object URL.
   */
  private loadBackground(uid: string) {
    if (this.backgroundObjectUrl) {
      URL.revokeObjectURL(this.backgroundObjectUrl);
      this.backgroundObjectUrl = null;
    }
    this.api.getBlob(`api/admin/certificate-templates/${uid}/background`, this.token)
      .subscribe({
        next: (blob) => { this.backgroundObjectUrl = URL.createObjectURL(blob); },
        error: () => { this.backgroundObjectUrl = null; },
      });
  }

  /** Prévia renderizada pelo backend, com dados de exemplo. */
  openPreview() {
    if (!this.templateForm?.uid) return;
    this.api.getBlob(
      `api/admin/certificate-templates/${this.templateForm.uid}/preview`, this.token,
    ).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: (err) => this.helper.message(
        err?.status === 400
          ? 'Cadastre a arte de fundo antes de visualizar.'
          : 'Não foi possível gerar a prévia.', 4000, 'danger'),
    });
  }

  uploadBackground(event: any) {
    const file: File = event.target.files?.[0];
    if (!file || !this.templateForm?.uid) return;
    this.api.upload(
      `api/admin/certificate-templates/${this.templateForm.uid}/background`,
      'background', file, this.token,
    ).subscribe({
      next: () => {
        this.helper.message('Arte atualizada', 2500, 'success');
        this.loadBackground(this.templateForm.uid);
      },
      error: (err) => this.helper.message(
        err?.error?.message || 'Não foi possível enviar a arte.', 4000, 'danger'),
    });
  }

  saveTemplate() {
    this.error = '';
    this.savingTemplate = true;

    const form = this.templateForm;
    const request = form.uid
      ? this.api.put(`api/admin/certificate-templates/${form.uid}`, form, this.token)
      : this.api.post('api/admin/certificate-templates', form, this.token);

    request.subscribe({
      next: (res: any) => {
        this.savingTemplate = false;
        if (!res.status) {
          this.error = (res.errors || []).join(' ');
          return;
        }
        // Num modelo novo, seguimos editando para permitir subir a arte, que
        // precisa do uid já criado.
        if (!form.uid) {
          this.templateForm = { ...this.templateForm, uid: res.uid };
          this.helper.message('Modelo criado. Agora envie a arte de fundo.', 4000, 'success');
          return;
        }
        this.templateForm = null;
        this.helper.message('Modelo salvo', 2500, 'success');
        this.switchTab('templates');
      },
      error: (err) => {
        this.savingTemplate = false;
        this.error = (err?.error?.errors || []).join(' ')
          || err?.error?.message || 'Não foi possível salvar.';
      },
    });
  }

  async deleteTemplate(template: any) {
    await this.helper.alerta(
      `Remover "${template.name}"?`, '',
      'Modelos que já emitiram certificados não podem ser removidos, só desativados.',
      [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover', role: 'destructive',
          handler: () => {
            this.api.delete(`api/admin/certificate-templates/${template.uid}`, this.token)
              .subscribe({
                next: (res: any) => {
                  if (!res.status) {
                    this.helper.message((res.errors || []).join(' '), 5000, 'danger');
                    return;
                  }
                  this.helper.message('Modelo removido', 2500, 'success');
                  this.switchTab('templates');
                },
                error: () => this.helper.message('Não foi possível remover.', 3000, 'danger'),
              });
          },
        },
      ],
    );
  }

  // =========================================================================
  // certificados
  // =========================================================================

  async revoke(certificate: any) {
    await this.helper.alerta(
      'Revogar certificado?',
      `${certificate.student_name} — ${certificate.course_title}`,
      'A verificação pública passará a mostrar que este certificado foi revogado. A ação não se desfaz.',
      [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Revogar', role: 'destructive',
          handler: () => {
            this.api.post(`api/admin/certificates/${certificate.uid}/revoke`,
              { reason: 'Revogado pela administração' }, this.token)
              .subscribe({
                next: () => {
                  this.helper.message('Certificado revogado', 2500, 'success');
                  this.switchTab('certificates');
                },
                error: () => this.helper.message('Não foi possível revogar.', 3000, 'danger'),
              });
          },
        },
      ],
    );
  }

  // =========================================================================
  // créditos
  // =========================================================================

  openCreditForm(user: any) {
    this.error = '';
    this.creditForm = {
      user_uid: user.uid,
      user_label: `${user.name || ''} ${user.lastname || ''}`.trim() || user.email,
      amount: '',
      description: '',
    };
  }

  saveCredit() {
    this.error = '';
    // Aceita "30" ou "30,00" — o mesmo formato que formatMoney exibe.
    const amountCents = Math.round(
      parseFloat(String(this.creditForm.amount).replace(',', '.')) * 100);

    if (!amountCents || amountCents <= 0) {
      this.error = 'Informe um valor maior que zero.';
      return;
    }

    this.savingCredit = true;
    this.api.post(`api/admin/users/${this.creditForm.user_uid}/credits`, {
      amount_cents: amountCents,
      description: this.creditForm.description || undefined,
    }, this.token).subscribe({
      next: (res: any) => {
        this.savingCredit = false;
        if (!res.status) {
          this.error = res.message;
          return;
        }
        this.creditForm = null;
        this.helper.message('Crédito adicionado', 2500, 'success');
        this.switchTab('users');
      },
      error: (err) => {
        this.savingCredit = false;
        this.error = err?.error?.message || 'Não foi possível adicionar o crédito.';
      },
    });
  }
}
