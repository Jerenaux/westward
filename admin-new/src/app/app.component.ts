import {Component, OnInit} from '@angular/core';
import {PlayersService} from "./services/players.service";
import {KeycloakService} from "./services/keycloak.service";
import {KeycloakProfile} from "keycloak-js";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'admin-new';

  userDetails: KeycloakProfile;

  constructor(private playersService: PlayersService, private keycloakService: KeycloakService) {

  }

  ngOnInit(): void {
    const buildingsObserv = this.playersService.getBuildings();

    // this.keycloakService.keycloakAuth.loadUserProfile().success((res) => {
    //   console.log('userDetails', res);
    // });



    buildingsObserv.subscribe(res => {
      console.log(res);
    }, (res) => {
      console.log(res);
    })
  }

  logout() {
    console.log('logout');

    this.keycloakService.logout();
  }
}

// docker run -e KEYCLOAK_USER=wwadmin -e KEYCLOAK_PASSWORD=wwadmin -e KEYCLOAK_IMPORT=/realm-config/realm-export.json -v /tmp/example-realm.json:/tmp/realm-export.json jboss/keycloak
