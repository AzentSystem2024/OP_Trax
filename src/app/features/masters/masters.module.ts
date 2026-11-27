import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MastersRoutingModule } from './masters-routing.module';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxFormModule,
  DxLookupModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxValidationSummaryModule,
  DxValidatorModule,
  DxLoadPanelModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxTagBoxModule,
  DxTooltipModule,
  DxRadioGroupModule,
  DxTabPanelModule,
  DxTemplateModule,
  DxTabsModule,
  DxTreeViewModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { ADOCGroupComponent } from './pages/adoc-category/adoc-group.component';
import { ADOCClassComponent } from './pages/adoc-class/adoc-class.component';
import { AdocCountingRulesComponent } from './pages/adoc-counting-rules/adoc-counting-rules.component';
import { AdocPriceMasterComponent } from './pages/adoc-price-master/price-master.component';
import { AdocClassEditFormModule } from '../../pages/POP-UP_PAGES/adoc-class-edit-form/adoc-class-edit-form.component';
import { ClinicianComponent } from './pages/clinician/clinician.component';
import { ClinicianNewFormModule } from '../../pages/POP-UP_PAGES/clinician-new-form/clinician-new-form.component';
import { ClinicianEditFormModule } from '../../pages/POP-UP_PAGES/clinician-edit-form/clinician-edit-form.component';
import { ClinicianCategoryComponent } from './pages/clinician-category/clinician-category.component';
import { ClinicianCategoryNewFormModule } from '../../pages/POP-UP_PAGES/clinician-category-new-form/clinician-category-new-form.component';
import { ClinicianMajorComponent } from './pages/clinician-major/clinician-major.component';
import { ClinicianMajorNewFormModule } from '../../pages/POP-UP_PAGES/clinician-major-new-form/clinician-major-new-form.component';
import { ClinicianProfessionComponent } from './pages/clinician-profession/clinician-profession.component';
import { ClinicianProfessionNewFormModule } from '../../pages/POP-UP_PAGES/clinician-profession-new-form/clinician-profession-new-form.component';
import { CPTCostingDepartmentAllocationComponent } from './pages/cpt-costing-department-allocation/cpt-costing-department-allocation.component';
import { CPTMasterComponent } from './pages/cpt-master/cpt-master.component';
import { CptMasterNewFormModule } from '../../pages/POP-UP_PAGES/cpt-master-new-form/cpt-master-new-form.component';
import { CptMasterEditFormModule } from '../../pages/POP-UP_PAGES/cpt-master-edit-form/cpt-master-edit-form.component';
import { CPTTypeComponent } from './pages/cpt-type/cpt-type.component';
import { CptTypeNewFormModule } from '../../pages/POP-UP_PAGES/cpt-type-new-form/cpt-type-new-form.component';
import { CPTWeightageComponent } from './pages/cpt-weightage/cpt-weightage.component';
import { DepartmentListComponent } from './pages/department/department-list.component';
import { ContactPanelModule } from 'src/app/components/library/contact-panel/contact-panel.component';
import { DepartmentNewFormModule } from '../../pages/POP-UP_PAGES/department-new-form/department-new-form.component';
import { DepartmentEditFormModule } from '../../pages/POP-UP_PAGES/department-edit-form/department-edit-form.component';
import { FacilityListComponent } from './pages/facility/facility-list.component';
import { FacilityGroupListComponent } from './pages/facility-group/facility-group-list.component';
import { FacilityGroupNewFormModule } from '../../pages/POP-UP_PAGES/facility-group-new-form/facility-group-new-form.component';
import { FacilityMultiplierMasterComponent } from './pages/facility-multiplier-master/facility-multiplier-master.component';
import { FacilityRegionComponent } from './pages/facility-region/facility-region.component';
import { FacilityRegionNewFormModule } from '../../pages/POP-UP_PAGES/facility-region-new-form/facility-region-new-form.component';
import { FacilityTypeComponent } from './pages/facility-type/facility-type.component';
import { FacilityTypeNewFormModule } from '../../pages/POP-UP_PAGES/facility-type-new-form/facility-type-new-form.component';
import { IcdAdocMappingComponent } from './pages/icd-adoc-mapping/icd-adoc-mapping.component';
import { ImportMasterDataComponent } from './pages/import-master-data/import-master-data.component';
import { ImportMasterDataFormModule } from '../../pages/POP-UP_PAGES/import-master-data-form/import-master-data-form.component';
import { ViewImportedMasterDataFormModule } from '../../pages/POP-UP_PAGES/view-imported-master-data-form/view-imported-master-data-form.component';
import { InsuranceMasterComponent } from './pages/insurance-master/insurance-master.component';
import { InsuranceNewFormModule } from '../../pages/POP-UP_PAGES/insurance-new-form/insurance-new-form.component';
import { SpecialityComponent } from './pages/speciality/speciality.component';
import { SpecialityNewFormModule } from '../../pages/POP-UP_PAGES/speciality-new-form/speciality-new-form.component';
import { SubDepartmentListComponent } from './pages/Sub-department/sub-department-list.component';
import { SubDepartmentNewFormModule } from '../../pages/POP-UP_PAGES/sub-department-new-form/sub-department-new-form.component';
import { SubDepartmentEditFormModule } from '../../pages/POP-UP_PAGES/sub-department-edit-form/sub-department-edit-form.component';
import { UserComponent } from './pages/user/user.component';
import { UserNewFormModule } from '../../pages/POP-UP_PAGES/user-new-form/user-new-form.component';
import { UserEditFormModule } from '../../pages/POP-UP_PAGES/user-edit-form/user-edit-form.component';
import { UserLevelMasterComponent } from './pages/user-role-master/user-role-master.component';
import { UserLevelNewFormModule } from '../../pages/POP-UP_PAGES/user-level-new-form/user-level-new-form.component';


@NgModule({
  declarations: [ADOCGroupComponent, ADOCClassComponent, AdocCountingRulesComponent, AdocPriceMasterComponent, ClinicianComponent, ClinicianCategoryComponent, ClinicianMajorComponent, ClinicianProfessionComponent, CPTCostingDepartmentAllocationComponent, CPTMasterComponent, CPTTypeComponent, CPTWeightageComponent, DepartmentListComponent, FacilityListComponent, FacilityGroupListComponent, FacilityMultiplierMasterComponent, FacilityRegionComponent, FacilityTypeComponent, IcdAdocMappingComponent, ImportMasterDataComponent, InsuranceMasterComponent, SpecialityComponent, SubDepartmentListComponent, UserComponent, UserLevelMasterComponent],
  imports: [
    CommonModule,
    MastersRoutingModule,
    DxButtonModule,
    DxCheckBoxModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxFormModule,
    DxLookupModule,
    DxPopupModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxValidationSummaryModule,
    DxValidatorModule,
    DxLoadPanelModule,
    DxDateBoxModule,
    DxNumberBoxModule,
    AdocClassEditFormModule,
    FormPopupModule,
    ClinicianNewFormModule,
    ClinicianEditFormModule,
    ClinicianCategoryNewFormModule,
    ClinicianMajorNewFormModule,
    ClinicianProfessionNewFormModule,
    DxTagBoxModule,
    CptMasterNewFormModule,
    CptMasterEditFormModule,
    CptTypeNewFormModule,
    ContactPanelModule,
    DepartmentNewFormModule,
    DepartmentEditFormModule,
    FacilityGroupNewFormModule,
    DxTooltipModule,
    DxRadioGroupModule,
    FacilityRegionNewFormModule,
    FacilityTypeNewFormModule,
    ImportMasterDataFormModule,
    ViewImportedMasterDataFormModule,
    InsuranceNewFormModule,
    SpecialityNewFormModule,
    SubDepartmentNewFormModule,
    SubDepartmentEditFormModule,
    UserNewFormModule,
    UserEditFormModule,
    DxTabPanelModule,
    DxTemplateModule,
    DxTabsModule,
    DxTreeViewModule,
    UserLevelNewFormModule,
  ],
  exports: [ADOCGroupComponent, ADOCClassComponent, AdocCountingRulesComponent, AdocPriceMasterComponent, ClinicianComponent, ClinicianCategoryComponent, ClinicianMajorComponent, ClinicianProfessionComponent, CPTCostingDepartmentAllocationComponent, CPTMasterComponent, CPTTypeComponent, CPTWeightageComponent, DepartmentListComponent, FacilityListComponent, FacilityGroupListComponent, FacilityMultiplierMasterComponent, FacilityRegionComponent, FacilityTypeComponent, IcdAdocMappingComponent, ImportMasterDataComponent, InsuranceMasterComponent, SpecialityComponent, SubDepartmentListComponent, UserComponent, UserLevelMasterComponent],
})
export class MastersModule { }
