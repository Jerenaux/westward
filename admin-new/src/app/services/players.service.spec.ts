import { TestBed } from '@angular/core/testing';

import { PlayersService } from './players.service';

describe('PlayersService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PlayersService = TestBed.get(PlayersService);
    expect(service).toBeTruthy();
  });
});
