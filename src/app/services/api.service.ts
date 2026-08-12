import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Cliente HTTP da API.
 *
 * O backend antigo recebia os dados como JSON em base64 no header
 * `Authorization`, o que impedia inspecionar requisições no DevTools e
 * estourava o tamanho do header em payloads maiores. As rotas novas usam corpo
 * JSON normal. Os métodos legados (`postWithToken` e afins) continuam aqui
 * porque as rotas antigas do backend ainda os aceitam durante a transição.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient) { }

  private url(path: string): string {
    // Tolera barra sobrando dos dois lados: com API_URL terminando em "/" o
    // resultado sairia com "//" no meio, e alguns servidores tratam isso como
    // outra rota.
    const base = environment.API_URL.replace(/\/+$/, '');
    return `${base}/${path.replace(/^\/+/, '')}`;
  }

  private headers(token?: string | null): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Token', token);
    return headers;
  }

  get<T = any>(path: string, token?: string | null): Observable<T> {
    return this.http.get<T>(this.url(path), { headers: this.headers(token) });
  }

  post<T = any>(path: string, body: any = {}, token?: string | null): Observable<T> {
    return this.http.post<T>(this.url(path), body, { headers: this.headers(token) });
  }

  put<T = any>(path: string, body: any = {}, token?: string | null): Observable<T> {
    return this.http.put<T>(this.url(path), body, { headers: this.headers(token) });
  }

  delete<T = any>(path: string, token?: string | null): Observable<T> {
    return this.http.delete<T>(this.url(path), { headers: this.headers(token) });
  }

  /** Upload de arquivo (arte do certificado, logo da instituição). */
  upload<T = any>(path: string, field: string, file: File, token?: string | null): Observable<T> {
    const form = new FormData();
    form.append(field, file);
    // Sem Content-Type: o browser precisa definir o boundary do multipart.
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Token', token);
    return this.http.post<T>(this.url(path), form, { headers });
  }

  getBlob(path: string, token?: string | null): Observable<Blob> {
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Token', token);
    return this.http.get(this.url(path), { headers, responseType: 'blob' });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(this.url('login'), { email, password });
  }

  refreshToken(token: string): Observable<any> {
    return this.http.post(this.url('refresh_token'), {}, { headers: this.headers(token) });
  }

  /**
   * Formato legado: JSON codificado em base64 no header Authorization.
   * Usado só pelas rotas do backend que ainda não migraram.
   */
  postLegacy<T = any>(path: string, data: any, token?: string | null): Observable<T> {
    let headers = new HttpHeaders({
      Authorization: 'Bearer ' + btoa(encodeURIComponent(JSON.stringify(data))),
    });
    if (token) headers = headers.set('Token', token);
    return this.http.post<T>(this.url(path), {}, { headers });
  }
}
