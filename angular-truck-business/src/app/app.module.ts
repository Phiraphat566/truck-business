import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms'; 
import { HttpClientModule } from '@angular/common/http'; // <- เพิ่มบรรทัดนี้
// ✅ Routing Module
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';

// ✅ Components
import { MainComponent } from './layout/main/main.component';

import { NgChartsModule } from 'ng2-charts';



@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule,    
    AppRoutingModule,
    FormsModule,
    NgChartsModule,
    HttpClientModule, // <- เพิ่มบรรทัดนี้
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
