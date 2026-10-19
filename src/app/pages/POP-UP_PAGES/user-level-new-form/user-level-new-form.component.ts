import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DxTabPanelModule,
  DxCheckBoxModule,
  DxSelectBoxModule,
  DxTemplateModule,
  DxTabsModule,
  DxTextBoxModule,
  DxButtonModule,
  DxDataGridModule,
  DxTreeViewModule,
  DxValidatorModule,
  DxValidatorComponent,
} from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { NotificationService } from "src/app/services/notification.service";

@Component({
  selector: 'app-user-level-new-form',
  templateUrl: './user-level-new-form.component.html',
  styleUrls: ['./user-level-new-form.component.scss'],
  providers: [MasterReportService],
})
export class UserLevelNewFormComponent implements OnInit {
  @Input() editValue: any;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @ViewChild('dataGrid', { static: false }) dataGrid: any;
  @ViewChild('userRoleValidator') userRoleValidator!: DxValidatorComponent;

  width = '100%';
  rtlEnabled: boolean = false;
  scrollByContent: boolean = true;
  showNavButtons: boolean = true;
  orientations: any = 'horizontal';
  stylingMode: any = 'primary';
  iconPosition: any = 'left';

  selectedTab = 0;
  selectedTabData: any[] = [];
  selectedRows: any = {};
  allSelectedRows: any[] = [];

  MenuDatasource: any;
  UserLevelValue: any = null;
  isErrorVisible = false;
  UserListdataSource: any;
  userRoles: any;
  CopiedUserLevelValue = '';
  searchQuery: string = '';

  canVerifyCostingData: boolean = false;
  canApproveCostingData: boolean = false;
  canUploadCostingData: boolean = false;
  canReprocessCostingData: boolean = false;

  // ======= constructor – injects the masterservice to call backend APIs ==============
  constructor(private masterservice: MasterReportService, private notificationService: NotificationService) {}

  // ======= lifecycle hook – gets called on component initialization ==============
  ngOnInit(): void {
    this.get_All_MenuList();
    this.fetch_all_UserLevel_list();
  }

  // ======= fetches the menu list for UserLevel from API and initializes default values =======
  get_All_MenuList() {
    this.masterservice.get_userLevel_menuList().subscribe((response: any) => {
      this.MenuDatasource = response.Data;
      this.initializeBooleanFields();
      this.set_initial_Values();
      // Process editValue after API data is loaded (if editValue exists)
      if (this.editValue) {
        this.processEditValue();
      }
    });
  }

  get currentTabName(): string {
    return this.MenuDatasource?.[this.selectedTab]?.text || 'Home';
  }

  get filteredMenus(): any[] {
    const menus = this.selectedTabData || [];
    if (!this.searchQuery || !this.searchQuery.trim()) {
      return menus;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return menus.filter(
      (m: any) => m.MenuName && m.MenuName.toLowerCase().includes(q)
    );
  }

  selectCategoryTab(index: number): void {
    this.selectedTab = index;
    this.selectedTabData = this.MenuDatasource?.[this.selectedTab]?.Menus || [];
  }

  getCategoryIcon(name: string): string {
    if (!name) return 'bi bi-folder2-open';
    const lower = name.toLowerCase();
    if (lower.includes('home')) return 'bi bi-house';
    if (lower.includes('system')) return 'bi bi-gear';
    if (lower.includes('master')) return 'bi bi-database';
    if (lower.includes('operation')) return 'bi bi-activity';
    if (lower.includes('report')) return 'bi bi-file-earmark-text';
    return 'bi bi-folder2-open';
  }

  isHomeTab(name: string): boolean {
    return !!name && name.toLowerCase().includes('home');
  }

  isRowSelected(menu: any): boolean {
    return (
      this.selectedRows[this.selectedTab]?.some(
        (r: any) => r.MenuId === menu.MenuId
      ) || false
    );
  }

  toggleRowSelection(menu: any): void {
    if (!this.UserLevelValue) {
      this.notificationService.showNotification(
        'User Role is required before selecting rows',
        'error'
      );
      if (this.userRoleValidator?.instance) {
        this.userRoleValidator.instance.validate();
      }
      return;
    }

    if (!this.selectedRows[this.selectedTab]) {
      this.selectedRows[this.selectedTab] = [];
    }

    const isSelected = this.isRowSelected(menu);
    if (isSelected) {
      this.selectedRows[this.selectedTab] = this.selectedRows[
        this.selectedTab
      ].filter((r: any) => r.MenuId !== menu.MenuId);
      menu.Selected = false;
    } else {
      this.selectedRows[this.selectedTab].push(menu);
      menu.Selected = true;
    }
    this.combineSelectedRows();
  }

  togglePermission(
    menu: any,
    permissionKey: 'canAdd' | 'canEdit' | 'canDelete' | 'canExport'
  ): void {
    if (!this.UserLevelValue) {
      this.notificationService.showNotification(
        'Please select or enter a User Role before updating permissions',
        'warning'
      );
      if (this.userRoleValidator?.instance) {
        this.userRoleValidator.instance.validate();
      }
      return;
    }

    menu[permissionKey] = !menu[permissionKey];

    if (!this.selectedRows[this.selectedTab]) {
      this.selectedRows[this.selectedTab] = [];
    }

    const isSelected = this.isRowSelected(menu);
    const anyChecked =
      menu.canAdd || menu.canEdit || menu.canDelete || menu.canExport;

    if (anyChecked && !isSelected) {
      this.selectedRows[this.selectedTab].push(menu);
      menu.Selected = true;
    }

    this.combineSelectedRows();
  }

  selectAllPermissions(): void {
    if (!this.UserLevelValue) {
      this.notificationService.showNotification(
        'User Role is required before selecting permissions',
        'error'
      );
      if (this.userRoleValidator?.instance) {
        this.userRoleValidator.instance.validate();
      }
      return;
    }

    const menus = this.filteredMenus;
    if (!this.selectedRows[this.selectedTab]) {
      this.selectedRows[this.selectedTab] = [];
    }

    menus.forEach((menu: any) => {
      menu.canAdd = true;
      menu.canEdit = true;
      menu.canDelete = true;
      menu.canExport = true;
      menu.Selected = true;
      if (!this.isRowSelected(menu)) {
        this.selectedRows[this.selectedTab].push(menu);
      }
    });

    this.combineSelectedRows();
  }

  deselectAllPermissions(): void {
    const menus = this.filteredMenus;
    if (!this.selectedRows[this.selectedTab]) {
      this.selectedRows[this.selectedTab] = [];
    }

    menus.forEach((menu: any) => {
      menu.canAdd = false;
      menu.canEdit = false;
      menu.canDelete = false;
      menu.canExport = false;
      menu.Selected = false;
      this.selectedRows[this.selectedTab] = this.selectedRows[
        this.selectedTab
      ].filter((r: any) => r.MenuId !== menu.MenuId);
    });

    this.combineSelectedRows();
  }

  isCurrentTabAllSelected(): boolean {
    if (!this.filteredMenus || this.filteredMenus.length === 0) return false;
    return this.filteredMenus.every((m: any) => this.isRowSelected(m));
  }

  toggleSelectAllCurrentTab(): void {
    if (this.isCurrentTabAllSelected()) {
      this.deselectAllPermissions();
    } else {
      this.selectAllPermissions();
    }
  }

  onSaveClick(): void {
    if (!this.UserLevelValue || !this.UserLevelValue.toString().trim()) {
      this.isErrorVisible = true;
      this.notificationService.showNotification(
        'User Role is required',
        'error'
      );
      if (this.userRoleValidator?.instance) {
        this.userRoleValidator.instance.validate();
      }
      return;
    }
    this.combineSelectedRows();
    this.save.emit();
  }

  onCancelClick(): void {
    this.cancel.emit();
  }

  processEditValue(): void {
    console.log('edit value is ::', this.editValue);
    this.allSelectedRows = [];
    this.UserLevelValue = this.editValue.UserRoles;
    this.canApproveCostingData = this.editValue.canApproveCostingData;
    this.canUploadCostingData = this.editValue.canUploadCostingData;
    this.canVerifyCostingData = this.editValue.canVerifyCostingData;
    this.canReprocessCostingData = this.editValue.canReprocessCostingData;
    this.MenuDatasource?.forEach((tab: any, index: any) => {
      const selectedRowKeys: any[] = [];

      tab.Menus?.forEach((menu: any) => {
        const match = this.editValue.usermenulist?.find(
          (m: any) => m.MenuId === menu.MenuId
        );

        if (match) {
          menu.canAdd = match.canAdd;
          menu.canEdit = match.canEdit;
          menu.canDelete = match.canDelete;
          menu.canExport = match.canExport;
          menu.Selected = true;
          selectedRowKeys.push(menu);
        } else {
          menu.canAdd = false;
          menu.canEdit = false;
          menu.canDelete = false;
          menu.canExport = false;
          menu.Selected = false;
        }
      });

      this.selectedRows[index] = selectedRowKeys;
    });

    this.selectedTab = 0;
    this.selectedTabData = this.MenuDatasource?.[this.selectedTab]?.Menus || [];
    this.combineSelectedRows();
  }

  // ======= fetches all user level role list for copy user-level functionality =======
  fetch_all_UserLevel_list() {
    this.masterservice.get_userLevel_List().subscribe({
      next: (response: any) => {
        const list = response?.data || response?.Data || [];
        this.UserListdataSource = list;
        this.userRoles = Array.isArray(list)
          ? list.map((user: any) => user.UserRoles).filter(Boolean)
          : [];
      },
      error: (err: any) => {
        console.error('Error fetching user roles list', err);
        this.UserListdataSource = [];
        this.userRoles = [];
      },
    });
  }

  // ======= set default values false for all permission checkboxes =======
  initializeBooleanFields() {
    this.MenuDatasource?.forEach((tab: any) => {
      tab.Menus?.forEach((menu: any) => {
        menu.canAdd = false;
        menu.canEdit = false;
        menu.canDelete = false;
        menu.canExport = false;
      });
    });
  }

  // ======= clears and resets the form fields when userLevel is changed/initialized =======
  set_initial_Values() {
    this.selectedTab = 0;
    this.selectedTabData = [];
    this.CopiedUserLevelValue = '';

    this.MenuDatasource?.forEach((_: any, index: number) => {
      this.selectedRows[index] = [];
    });

    this.selectedTabData = this.MenuDatasource?.[this.selectedTab]?.Menus || [];
  }

  // ======== editing prepared value =======
  onEditorPreparing(e: any): void {
    if (
      e.parentType === 'dataRow' &&
      ['canAdd', 'canEdit', 'canDelete', 'canExport'].includes(e.dataField)
    ) {
      const isSelected = this.selectedRows[this.selectedTab]?.some(
        (row: any) => row === e.row.data
      );

      // If not selected, make the cell read-only
      if (!isSelected) {
        e.editorOptions.readOnly = true;
      }
    }
  }

  // ======= on change of UserLevel copy dropdown – loads selected role’s permissions =======
  onUserRoleCopySelectionChange(event: any): void {
    if (!event || !event.value) {
      return;
    }

    if (!this.UserLevelValue) {
      this.isErrorVisible = true;
      this.notificationService.showNotification('User Role is required before copying user role', 'error');

      if (this.userRoleValidator?.instance) {
        this.userRoleValidator.instance.validate();
      }

      // Clear selected copy user in UI
      this.CopiedUserLevelValue = '';

      return;
    }
    const copiedUser = this.UserListdataSource?.find(
      (user: any) => user.UserRoles === event.value
    );
    if (copiedUser?.usermenulist) {
      const userMenuList = copiedUser.usermenulist;
      this.canApproveCostingData = copiedUser.canApproveCostingData;
      this.canUploadCostingData = copiedUser.canUploadCostingData;
      this.canVerifyCostingData = copiedUser.canVerifyCostingData;
      this.canReprocessCostingData = copiedUser.canReprocessCostingData;
      this.selectedRows = {}; // Clear previous selections

      this.MenuDatasource.forEach((tab: any, tabIndex: number) => {
        const matchedMenus: any[] = [];

        tab.Menus?.forEach((menu: any) => {
          const copiedMenu = userMenuList.find(
            (m: any) => m.MenuId === menu.MenuId
          );

          if (copiedMenu) {
            // Update only those that exist in the copied role
            menu.canAdd = copiedMenu.canAdd;
            menu.canEdit = copiedMenu.canEdit;
            menu.canDelete = copiedMenu.canDelete;
            menu.canExport = copiedMenu.canExport;
            menu.Selected = true;

            matchedMenus.push(menu); // Mark as selected
          } else {
            // Clear selection and permissions if not present in the copied role
            menu.canAdd = false;
            menu.canEdit = false;
            menu.canDelete = false;
            menu.canExport = false;
            menu.Selected = false;
          }
        });

        this.selectedRows[tabIndex] = matchedMenus;
      });

      this.selectedTabData = this.MenuDatasource[this.selectedTab]?.Menus || [];
      this.combineSelectedRows();
    }
  }

  // ======= handles tab click event – change selected tab index and menus =======
  onTabClick(event: any): void {
    this.selectedTab = event.itemIndex;
    this.selectedTabData = this.MenuDatasource[this.selectedTab]?.Menus || [];
  }

  // ========== check box value changed event ==========
  onPermissionCheckboxChanged(): void {
    if (this.UserLevelValue) {
      this.combineSelectedRows();
    } else {
      this.notificationService.showNotification('Please select a User Role before updating permissions', 'warning');
    }
  }

  // ======= triggered when user selects/deselects a row in datagrid =======
  onSelectionChanged(event: any): void {
    if (!this.UserLevelValue) {
      this.isErrorVisible = true;
      this.notificationService.showNotification('User Role is required before selecting rows', 'error');
      if (this.userRoleValidator?.instance) {
        this.userRoleValidator.instance.validate();
      }
      const grid = event.component;
      grid.clearSelection();
      this.selectedRows[this.selectedTab] = [];
      return;
    }

    // Valid selection
    this.isErrorVisible = false;
    this.selectedRows[this.selectedTab] = event.selectedRowsData;

    // Force refresh to enable editing
    event.component.refresh();

    if (
      (event?.selectedRowKeys && event.selectedRowKeys.length > 0) ||
      (event?.deselectedRowKeys && event.deselectedRowKeys.length > 0)
    ) {
      this.combineSelectedRows();
    }
  }

  // ======= combine all tab wise selected rows into a single array with permission flags =======
  combineSelectedRows(): void {
    this.allSelectedRows = [];

    Object.keys(this.selectedRows)
      .filter((key) => this.selectedRows[key]?.length)
      .forEach((key) => {
        const menus = this.selectedRows[key].map((menu: any) => ({
          MenuId: menu.MenuId,
          canAdd: menu.canAdd,
          canEdit: menu.canEdit,
          canDelete: menu.canDelete,
          canExport: menu.canExport,
        }));

        const existingEntry = this.allSelectedRows.find(
          (row) => row.userLevelname === this.UserLevelValue
        );

        const baseEntry = {
          userLevelname: this.UserLevelValue,
          canVerifyCostingData: this.canVerifyCostingData,
          canApproveCostingData: this.canApproveCostingData,
          canUploadCostingData: this.canUploadCostingData,
          canReprocessCostingData: this.canReprocessCostingData,
          Menus: menus,
          ...(this.editValue ? { userLevelID: this.editValue.ID } : {}),
        };

        if (existingEntry) {
          existingEntry.Menus.push(...menus);
        } else {
          this.allSelectedRows.push(baseEntry);
          console.log('latest selected data :>>', this.allSelectedRows);
        }
      });
  }

  // ======= reset all form fields to initial stage =======
  resetFormValues() {
    this.UserLevelValue = null;
    this.CopiedUserLevelValue = '';
    this.selectedTab = 0;
    this.selectedTabData = [];
    this.selectedRows = {};
    this.initializeBooleanFields();
    this.allSelectedRows = [];
    this.searchQuery = '';
    if (this.MenuDatasource && this.MenuDatasource.length > 0) {
      this.selectedTabData = this.MenuDatasource[0].Menus || [];
    }
  }

  // ======= returns new user level data of all selected menu permissions =======
  getNewUSerLevelData = () => ({ ...this.allSelectedRows });
}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DxTabPanelModule,
    DxCheckBoxModule,
    DxSelectBoxModule,
    DxTemplateModule,
    DxTabsModule,
    DxTextBoxModule,
    DxButtonModule,
    DxDataGridModule,
    DxTreeViewModule,
    DxValidatorModule,
  ],
  declarations: [UserLevelNewFormComponent],
  exports: [UserLevelNewFormComponent],
})
export class UserLevelNewFormModule {}
