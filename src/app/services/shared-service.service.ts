import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedServiceService {
  private loadComponentSource = new Subject<boolean>();
  loadComponent$ = this.loadComponentSource.asObservable();

  triggerLoadComponent(load: boolean) {
    this.loadComponentSource.next(load);
  }
}
