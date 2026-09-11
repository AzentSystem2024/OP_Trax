import {
  Component, Input, NgModule, OnChanges, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DxButtonModule,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { Opportunity } from 'src/app/types/opportunities';
import { OpportunityTileModule } from 'src/app/components/utils/opportunity-tile/opportunity-tile.component';
import { NotificationService } from "src/app/services/notification.service";

@Component({
  selector: 'card-opportunities',
  templateUrl: './card-opportunities.component.html',
  styleUrls: ['./card-opportunities.component.scss'],
})
export class CardOpportunitiesComponent implements OnChanges {
  @Input() openedOpportunities: Opportunity[];

  @Input() closedOpportunities: Opportunity[];

  isLoading = true;

  ngOnChanges(changes: SimpleChanges) {
    const isLoadActive = !changes.openedOpportunities?.currentValue;
    const isLoadClosed = !changes.closedOpportunities?.currentValue;

    this.isLoading = isLoadActive || isLoadClosed;
  }

    constructor(private notificationService: NotificationService) {
    }
}

@NgModule({
  imports: [
    DxButtonModule,
    DxLoadPanelModule,
    OpportunityTileModule,

    CommonModule,
  ],
  declarations: [CardOpportunitiesComponent],
  exports: [CardOpportunitiesComponent],
})
export class CardOpportunitiesModule { }
