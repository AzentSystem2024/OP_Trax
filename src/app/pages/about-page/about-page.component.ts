import { Component } from '@angular/core';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
})
export class AboutPageComponent {
  customerInfo: any;
  constructor(private dataservice: DataService) {
    this.customerInfo = this.dataservice.fetch_customer_name();
  }
}
