import { Component, NgModule, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { CardAuthModule } from '../../components/library/card-auth/card-auth.component';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import { SharedServiceService } from 'src/app/services/shared-service.service';
@Component({
  selector: 'app-single-card',
  templateUrl: './single-card.component.html',
  styleUrls: ['./single-card.component.scss'],
})
export class SingleCardComponent {
  @Input()
  title!: string;

  @Input()
  description!: string;

  loadImgComponent: boolean = false;

  constructor(private sharedService: SharedServiceService) {
    this.sharedService.loadComponent$.subscribe((load) => {
      this.loadImgComponent = load;
    });
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxScrollViewModule,
    CardAuthModule,
    DxLoadIndicatorModule,
  ],
  exports: [SingleCardComponent],
  declarations: [SingleCardComponent],
})
export class SingleCardModule {}
