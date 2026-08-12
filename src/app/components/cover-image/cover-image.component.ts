import { Component, Input } from '@angular/core';

/**
 * Capa de curso com fallback textual.
 *
 * As capas vêm do site de origem e quebram com frequência (arquivo removido,
 * hotlink bloqueado), e alguns cursos nem têm imagem salva. Antes disso o
 * navegador mostrava o ícone de imagem quebrada com o texto alternativo
 * derramando por cima do layout.
 *
 * Aqui o (error) do <img> troca a imagem por um bloco que ocupa exatamente o
 * mesmo espaço e mostra o nome do curso — parece uma capa, não um defeito.
 */
@Component({
  selector: 'cover-image',
  templateUrl: './cover-image.component.html',
  styleUrls: ['./cover-image.component.scss'],
  standalone: false,
})
export class CoverImageComponent {

  @Input() src?: string | null;
  @Input() title = '';

  broken = false;

  private _lastSrc?: string | null;

  /** Reseta o estado quando a linha é reaproveitada para outro curso. */
  ngOnChanges() {
    if (this.src !== this._lastSrc) {
      this._lastSrc = this.src;
      this.broken = false;
    }
  }

  get showFallback(): boolean {
    return this.broken || !this.src;
  }

  /**
   * Iniciais para o bloco de fallback: primeira letra das duas primeiras
   * palavras que não sejam conectivos.
   */
  get initials(): string {
    const skip = new Set(['de', 'da', 'do', 'e', 'em', 'a', 'o', 'com', 'para']);
    const words = (this.title || '')
      .split(/\s+/)
      .map(w => w.replace(/[^\p{L}\p{N}]/gu, ''))
      .filter(w => w && !skip.has(w.toLowerCase()));

    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  }

  onError() {
    this.broken = true;
  }
}
