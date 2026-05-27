import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PopupStateService {
  private popupStates: { [key: string]: boolean } = {};

  // setPopupState(popupId: string, isOpen: boolean) {
  //   this.popupStates[popupId] = isOpen;
  //   console.log(`Popup state updated: ${popupId} isOpen=${isOpen}`, this.popupStates);
  // }

  setPopupState(popupId: string, isOpen: boolean) {
    // Ensure we track the state of each popup independently
    if (this.popupStates[popupId] !== isOpen) {
      this.popupStates[popupId] = isOpen;
    }
  }
  

  getPopupState(popupId: string): boolean {
    return this.popupStates[popupId] || false;
  }
  
}

