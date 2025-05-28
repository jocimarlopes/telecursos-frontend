import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  token: any = ''

  constructor(
    private http: HttpClient,
    ) { }


  get(urlWithParams: string) {
    return this.http.get(urlWithParams).pipe(map((res: any) => res));
  }

  postLogin(credentials: any) {
    const basic = btoa(`${credentials.email}:${credentials.password}`)
    const headers = new HttpHeaders({ "Content-Type": "application/json" , "Authorization": "Basic " + basic})
    return this.http.post(`${environment.API_URL}/login`, {}, { headers: headers}).pipe(map((res: any) => res));
  }

  postWithoutToken(url: string, dados: any) {
    const headers = new HttpHeaders({ "Content-Type": "application/json" , "Authorization": "Bearer " + btoa(JSON.stringify(dados))})
    return this.http.post(`${environment.API_URL}/${url}`, {}, { headers: headers}).pipe(map((res: any) => res));
  }

  postWithToken(url: string, dados: any, token: string) {
    const headers = new HttpHeaders({ 
      "Authorization": "Bearer " + btoa(encodeURIComponent(JSON.stringify(dados))),
      "Token": token,
    })
    return this.http.post(`${environment.API_URL}/${url}`, {}, { headers: headers}).pipe(map((res: any) => res));
  }

  postWithTokenBlob(url: string, dados: any, token: string) {
    const headers = new HttpHeaders({ 
      "Authorization": "Bearer " + btoa(encodeURIComponent(JSON.stringify(dados))),
      "Token": token,
    })
    return this.http.post(`${environment.API_URL}/${url}`, {}, { headers: headers, responseType: 'blob'}).pipe(map((res: any) => res));
  }

  refreshToken(token: string) {
    const headers = new HttpHeaders({ 
      "Token": token,
    })
    return this.http.post(`${environment.API_URL}/refresh_token`, {}, { headers: headers}).pipe(map((res: any) => res)); 
  }

}
