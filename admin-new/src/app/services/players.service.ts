import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Cat {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayersService {
  constructor(private http: HttpClient) {}

  getBuildings(): Observable<Cat[]> {
    return this.http.get<Cat[]>('http://localhost:8081/admin/buildings');
  }

  getCountItems(): Observable<Cat[]> {
    return this.http.get<Cat[]>('http://localhost:8081/admin/count-items');
  }

  getEvents(): Observable<Cat[]> {
    return this.http.get<Cat[]>('http://localhost:8081/admin/events');
  }

  getPlayers(): Observable<Cat[]> {
    return this.http.get<Cat[]>('http://localhost:8081/admin/players');
  }

  getScreenshots(): Observable<Cat[]> {
    return this.http.get<Cat[]>('http://localhost:8081/admin/screenshots');
  }

}
