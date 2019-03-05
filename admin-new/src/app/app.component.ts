import {Component, OnInit} from '@angular/core';
import {PlayersService} from "./services/players.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'admin-new';

  constructor(private playersService: PlayersService) {

  }

  ngOnInit(): void {
    const buildingsObserv = this.playersService.getBuildings();

    buildingsObserv.subscribe(res => {
      console.log(res);
    }, (res) => {
      console.log(res);
    })

  }

}
