import {
  Component, NgModule, Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Opportunity } from 'src/app/types/opportunities';
import { NotificationService } from "src/app/services/notification.service";

@Component({
  selector: 'opportunity-tile',
  templateUrl: 'opportunity-tile.component.html',
  styleUrls: ['./opportunity-tile.component.scss'],
})

export class OpportunityTileComponent {
  @Input() data: Opportunity;

  opportunityClick() {
    this.notificationService.showNotification('Click opportunity event', 'success');
  }

    constructor(private notificationService: NotificationService) {
    }
}

@NgModule({
  imports: [CommonModule],
  declarations: [OpportunityTileComponent],
  exports: [OpportunityTileComponent],
})
export class OpportunityTileModule { }