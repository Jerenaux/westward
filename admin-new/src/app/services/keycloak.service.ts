import {Injectable} from '@angular/core';
import * as Keycloak from "keycloak-js";

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  constructor() {
  }

  public keycloakAuth: any;

  init(): Promise<any> {
    return new Promise((resolve, reject) => {
      const config = {
        'url': 'http://localhost:8080/auth',
        'realm': 'westward',
        'clientId': 'westward'
      };
      this.keycloakAuth = Keycloak(config);
      this.keycloakAuth.init({onLoad: 'login-required'})
        .success(() => {
          resolve();
          // const authenticated = this.);
          this.getToken().then((aaa) => {
            console.log('aaaaa',aaa);
          });
        })
        .error(() => {
          reject();
        });
    });
  }

  // getToken(): string {
  //   return this.keycloakAuth.token;
  // }
  //
  // static init(options?: any): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     KeycloakService.keycloakAuth.init(options)
  //       .success(() => {
  //         resolve();
  //       })
  //       .error((errorData: any) => {
  //         reject(errorData);
  //       });
  //   });
  // }

  authenticated(): boolean {
    return this.keycloakAuth.authenticated;
  }

  login() {
    this.keycloakAuth.login();
  }

  logout() {
    this.keycloakAuth.logout();
  }

  account() {
    this.keycloakAuth.accountManagement();
  }

  getToken(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.keycloakAuth.token) {
        this.keycloakAuth
          .updateToken(5)
          .success(() => {
            resolve(<string>this.keycloakAuth.token);

            console.log(this.keycloakAuth.idTokenParsed);
            console.log('Wellcome ' + this.keycloakAuth.idTokenParsed.name);

          })
          .error(() => {
            reject('Failed to refresh token');
          });
      } else {
        reject('Not loggen in');
      }
    });
  }

}
