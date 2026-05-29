import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxFormComponent,
  DxFormModule,
  DxNumberBoxModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTagBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxToolbarModule,
  DxTreeListComponent,
  DxTreeListModule,
  DxValidatorComponent,
  DxValidatorModule,
} from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { Component, NgModule, ViewChild } from '@angular/core';
import { DataService } from 'src/app/services';
import { DxTreeListTypes } from 'devextreme-angular/ui/tree-list';
import notify from 'devextreme/ui/notify';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auto-download-settings',
  templateUrl: './auto-download-settings.component.html',
  styleUrls: ['./auto-download-settings.component.scss'],
})
export class AutoDownloadSettingsComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild(DxTreeListComponent, { static: true })
  treelist!: DxTreeListComponent;

  @ViewChild('dateValidator', { static: false })
  dateValidator!: DxValidatorComponent;

  isDatabaseNameEditable = false;
  isXMLDirectoryEditable = false;

  dataSource: any[] = [];

  FacilityDataSource: any;
  filteredFacilityDataSource: any;
  instanceCounter: number = 1;

  DatabaseName: any;
  XMLDirectory: any;
  ServiceInterval: any;
  ClaimTransactionStartDate: any = new Date();

  editingRowData: any;

  Facility_Value: any[] = [];
  InstanceValue: any;
  instanceClaimDownloadStartDate: any;

  Update_InstanceValue: any;
  Update_Facility_Value: any[] = [];
  update_instanceClaimDownloadStartDate: any;

  isAddPopupVisible: boolean = false;
  is_EditFormVisible: boolean = false;
  updatenodeId: any;
  isChildNodeData: boolean = false;
  private currentMaxId = Math.max(...this.dataSource.map((item) => item.id), 0);
  iseditfilteredFacility: any;

  InstanceCount: number = 0;
  menuPrevilage:any;

  constructor(private dataService: DataService, private route: ActivatedRoute) {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });
    console.log('menu previliages of the page', this.menuPrevilage);
    this.get_Facility_List();
    this.get_settingsData_List();
  }
  //======used to enable add button only parent nodes of the tree view=======
  // allowAdding = ({ row }) => row.data.parentId === null;
  allowAdding:any =  false;

  get_Facility_List() {
    this.dataService
      .get_UserWise_FacilityList_Data()
      .subscribe((response: any) => {
        this.FacilityDataSource = response.facilityDetails;

        if (this.FacilityDataSource?.length == 1) {
          // Auto-select first facility
          this.Facility_Value = [this.FacilityDataSource[0].FacilityLicense];
        }
      });
  }

  //===============fetch settings annd instance data from API==============
  get_settingsData_List() {
    this.dataService
      .get_AutoDownload_Instance_Settings()
      .subscribe((response: any) => {
        const { Settings: settingsData, InstanceFacility } = response;

        // Extract settings data
        this.DatabaseName = settingsData.LogDatabase;
        this.ServiceInterval = settingsData.ServiceInterval;
        this.XMLDirectory = settingsData.SaveXMLDirectory;
        this.isDatabaseNameEditable = !!this.DatabaseName;
        this.isXMLDirectoryEditable = !!this.XMLDirectory;

        this.dataSource = InstanceFacility.map(
          ({
            ID,
            ParentID,
            InstanceNo,
            FacilityID,
            FacilityName,
            ClaimTransactionDate,
          }:any) => ({
            id: ID,
            parentId: ParentID,
            Instance: InstanceNo,
            Facility: FacilityID,
            FacilityName: FacilityName,
            ClaimTransactionDate: ClaimTransactionDate
              ? new Date(ClaimTransactionDate)
              : null,
          })
        );
      });
  }

  //======================row drag and reordering ==========================
  onDragChange(e: DxTreeListTypes.RowDraggingChangeEvent) {
    const sourceNode = e.component.getNodeByKey(e.itemData.id);
    // Prevent dragging for root-level rows (parentId === null)
    if (sourceNode.data.parentId === null) {
      e.event.preventDefault(); // Prevent the drag action
    }
  }

  //====================row drag and reordering completed===================
  onReorder = (e: DxTreeListTypes.RowDraggingReorderEvent) => {
    const visibleRows = e.component.getVisibleRows();
    const sourceData = e.itemData;
    // Prevent reordering if the sourceData is a root-level row
    if (sourceData.parentId === null) {
      e.event.preventDefault();
      return;
    }
    if (e.dropInsideItem) {
      const targetNode = visibleRows[e.toIndex].node;
      if (targetNode && targetNode.data.parentId === null) {
        sourceData.parentId = targetNode.key;
        sourceData.Instance = targetNode.data.Instance;
      } else {
        e.event.preventDefault();
      }
    } else {
      const toIndex = e.fromIndex > e.toIndex ? e.toIndex - 1 : e.toIndex;
      const targetData = toIndex >= 0 ? visibleRows[toIndex].node.data : null;
      // Allow reordering among valid siblings
      if (targetData && targetData.parentId === sourceData.parentId) {
        const sourceIndex = this.dataSource.indexOf(sourceData);
        this.dataSource.splice(sourceIndex, 1);
        const targetIndex = this.dataSource.indexOf(targetData) + 1;
        this.dataSource.splice(targetIndex, 0, sourceData);
      } else {
        e.event.preventDefault(); // Prevent invalid reordering
      }
    }
    console.log(
      'datasource after instance row dragging eneded ==>>',
      this.dataSource
    );
    e.component.refresh();
  };

  //====================New instance add button click event================
  on_Add_New_Instance(e: any) {
    e.event?.stopPropagation();
    const usedFacilityIds = new Set(
      this.dataSource.map((item) => item.Facility)
    );
    this.filteredFacilityDataSource = this.FacilityDataSource.filter(
      (facility:any) => !usedFacilityIds.has(facility.FacilityID)
    );

    if (this.filteredFacilityDataSource.length === 0) {
      notify(
        {
          message:
            'All facilities are already assigned to existing instances. No facilities available to add at this time.',
          position: { at: 'top right', my: 'top right' },
          hideDuration: 3000,
        },
        'error'
      );
    } else {
      console.log('datasorce::>>', this.dataSource);
      this.InstanceValue = this.getNextInstanceNumber();
      this.isAddPopupVisible = true;
      this.is_EditFormVisible = false;
    }
  }

  getNextInstanceNumber(): string {
    const instanceNumbers = this.dataSource
      .filter((item) => item.parentId == null)
      .map((item) => parseInt(item.Instance.trim(), 10))
      .filter((num) => !isNaN(num));

    const nextInstance = instanceNumbers.length
      ? Math.max(...instanceNumbers) + 1
      : 1;

    return nextInstance.toString();
  }

  //==================editing start event =============================
  onEditingStart(e: any): void {
    this.updatenodeId = e.data.id;
    // Fetch the current parent node's ID
    const selectedNodeId = e.data.id;
    const parentId = e.data.parentId;
    if (!parentId) {
      e.cancel = true;
      // Fetch all child nodes of the current parent
      const childNodes = this.dataSource.filter(
        (item) => item.parentId === selectedNodeId
      );
      // Collect all facility IDs used by the current parent's children
      const currentParentFacilityIds = new Set(
        childNodes.map((item) => item.Facility)
      );
      // Collect all facility IDs used across the entire dataSource
      const allUsedFacilityIds = new Set(
        this.dataSource
          .filter((item) => item.Facility !== null)
          .map((item) => item.Facility)
      );
      this.iseditfilteredFacility = this.FacilityDataSource.filter(
        (facility:any) =>
          currentParentFacilityIds.has(facility.FacilityID) ||
          !allUsedFacilityIds.has(facility.FacilityID)
      );
      // Initialize popup fields
      this.Update_InstanceValue = e.data.Instance;
      this.update_instanceClaimDownloadStartDate = null;

      this.Update_Facility_Value = Array.from(currentParentFacilityIds);
      // Show the popup
      this.is_EditFormVisible = true;
    } else {
      e.cancel = false;
      this.isChildNodeData = true;
    }
  }

  //=========================onclick of save button ==========================
  onAddClick = () => {
    const maxId = Math.max(...this.dataSource.map((item) => item.id), 0);
    // Add a parent entry
    const parentEntry = {
      id: maxId + 1,
      parentId: null,
      Instance: this.InstanceValue,
      Facility: null,
      ClaimTransactionDate: null,
    };
    this.dataSource.push(parentEntry);

    // Add child entries for each selected facility
    this.Facility_Value.forEach((facilityId, index) => {
      const childEntry = {
        id: maxId + 2 + index, // Ensure unique IDs
        parentId: parentEntry.id,
        Instance: this.InstanceValue,
        Facility: facilityId,
        ClaimTransactionDate: this.instanceClaimDownloadStartDate,
      };
      this.dataSource.push(childEntry);
    });
    this.resetForm();
  };
  //=================== Edit the instance by clicking parent node ==============
  On_Update_DataSource() {
    const validationResult = this.dateValidator.instance.validate();
    if (validationResult.isValid) {
      const newFacilities = this.Update_Facility_Value; // Facilities to add
      const parentId = this.updatenodeId; // Parent node ID
      console.log('new facility values are :>', newFacilities);
      // Update parent node
      const parentNode = this.dataSource.find((node) => node.id === parentId);
      if (parentNode) {
        parentNode.Instance = this.Update_InstanceValue;
      }
      // Filter out child nodes that do not belong to newFacilities
      this.dataSource = this.dataSource.filter(
        (node) =>
          node.parentId !== parentId || newFacilities.includes(node.Facility)
      );
      // Add or update child nodes for each facility
      newFacilities.forEach((facility) => {
        // Check if the facility already exists as a child of the parent
        let existingChild = this.dataSource.find(
          (node) => node.parentId === parentId && node.Facility === facility
        );
        if (!existingChild) {
          // Create a new child node if it doesn't exist
          const newId = this.generateUniqueId();
          existingChild = {
            id: newId,
            parentId: parentId,
            Instance: this.Update_InstanceValue,
            Facility: facility,
            ClaimTransactionDate: this.update_instanceClaimDownloadStartDate,
          };
          // Add the new child node to the dataSource
          this.dataSource.push(existingChild);
        } else {
          // Update existing child node
          existingChild.Instance = this.Update_InstanceValue;
          existingChild.ClaimTransactionDate =
            this.update_instanceClaimDownloadStartDate;
        }
      });
      this.is_EditFormVisible = false;
    }
  }

  //==================facility dropdown selection change event=================
  onFacilitySelectionChange(event: any): void {
    this.Update_Facility_Value = event.value;
  }
  //=====unique id making for insering data==================
  generateUniqueId(): number {
    const allIds = this.dataSource
      .map((item) => item.id)
      .filter((id) => id !== null && id !== undefined);
    const nextId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
    return nextId;
  }

  // ==========Function to Delete the Selected Row================
  deleteRow(event: any) {
    const deletedId = event.data.id;
    const isParent = this.dataSource.some(
      (item) => item.parentId === deletedId
    );
    if (isParent) {
      // Remove the parent and all its children
      this.dataSource = this.dataSource.filter(
        (item) => item.id !== deletedId && item.parentId !== deletedId
      );
    } else {
      // Remove only the child
      this.dataSource = this.dataSource.filter((item) => item.id !== deletedId);
    }
    // Refresh the TreeList (if necessary)
    event.component.refresh();
  }
  //====================Reset the add popup form===================
  resetForm(): void {
    this.isAddPopupVisible = false;
    this.InstanceValue = '';
    this.Facility_Value = [];
    this.instanceClaimDownloadStartDate = null;

    this.is_EditFormVisible = false;
    this.Update_InstanceValue = '';
    this.update_instanceClaimDownloadStartDate = null;

    this.Update_Facility_Value = [];
  }

  //======================on click event of save button =======================
  on_Click_Save_Settings = () => {
    const userId = parseInt(sessionStorage.getItem('UserID') || '0', 10);
    console.log('Final data to insert:', this.dataSource);
    let formatDate = (date: Date | null) => {
      if (!date) return null;

      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      ); // Adjust for timezone
      return localDate.toISOString().split('T')[0]; // Format as 'yyyy-MM-dd'
    };

    const downloadInstance = this.dataSource
      .filter((item: any) => item.parentId !== null)
      .map((item: any) => ({
        InstanceNo: parseInt(item.Instance),
        FacilityID: item.Facility,
        ClaimTransactionDate: formatDate(item.ClaimTransactionDate), // Use formatted date
      }));

    const finalData = {
      UserID: userId,
      LogDatabase: this.DatabaseName,
      ServiceInterval: this.ServiceInterval,
      SaveXMLDirectory: this.XMLDirectory,
      download_instance: downloadInstance,
    };

    this.dataService.autoDownload_Instance_Settings_insert(finalData).subscribe(
      (response) => {
        notify(
          {
            message: 'Download settings saved successfully',
            position: { at: 'top right', my: 'top right' },
            hideDuration: 3000,
          },
          'success'
        );
      },
      (error) => {
        notify(
          {
            message: 'Save Download settings failed',
            position: { at: 'top right', my: 'top right' },
            hideDuration: 3000,
          },
          'error'
        );
      }
    );
  };

  //=========================onclick of clear button ==========================
  onClearClick = () => {
    // Reset form-bound properties
    this.isDatabaseNameEditable = false;
    this.isXMLDirectoryEditable = false;
    this.DatabaseName = '';
    this.XMLDirectory = '';
    this.ServiceInterval = '';
  };
}
@NgModule({
  imports: [
    CommonModule,
    DxToolbarModule,
    DxSelectBoxModule,
    DxTextAreaModule,
    DxFormModule,
    DxCheckBoxModule,
    DxButtonModule,
    DxTagBoxModule,
    DxDateBoxModule,
    DxTextBoxModule,
    DxDataGridModule,
    DxTreeListModule,
    DxPopupModule,
    DxDropDownBoxModule,
    DxNumberBoxModule,
    DxValidatorModule,
  ],
  providers: [],
  exports: [],
  declarations: [AutoDownloadSettingsComponent],
})
export class AutoDownloadSettingsModule {}
