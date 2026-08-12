/**
 * Os cursos não têm id próprio: vêm de um scraping e são identificados pela
 * URL de origem. Para que /curso/:ref seja uma URL compartilhável, a origem é
 * codificada em base64url (sem "+", "/" e "=", que quebram o segmento de rota).
 */

export function encodeCourseRef(link: string): string {
  const base64 = btoa(unescape(encodeURIComponent(link)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeCourseRef(ref: string): string {
  let base64 = ref.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return decodeURIComponent(escape(atob(base64)));
}
