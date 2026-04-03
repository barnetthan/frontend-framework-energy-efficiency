import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Needed for the tab system

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // This will be your 'Independent Variable' controller [cite: 22]
  activeTab: string = 'IDLE';

  // You will add your 'Workload' functions here later [cite: 30, 31]
}
