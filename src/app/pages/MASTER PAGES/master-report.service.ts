import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { ConfigService } from 'src/app/services/config.service';

const Token = JSON.parse(localStorage.getItem('Token') || '{}');

const gender: any = [
  { description: 'Male' },
  { description: 'Female' },
  { description: 'Others' },
];

@Injectable({
  providedIn: 'root',
})
export class MasterReportService {
  constructor(
    private http: HttpClient,
    private config: ConfigService,
  ) {}

  private get BASE_URL(): string {
    return this.config.apiBaseUrl;
  }

  //======Fetch gender data======
  get_gender_Data() {
    return gender;
  }

  //======Facility Drop down data=====================
  Get_GropDown(dropDownField: any) {
    const Url = `${this.BASE_URL}dropdown`;
    const reqBody = { name: dropDownField };
    return this.http.post(Url, reqBody);
  }
  //==========================================USER LEVEL MASTER======================================================
  //============List of User Level==============
  get_userLevel_List() {
    const Url = `${this.BASE_URL}userrole/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }

  get_userLevel_menuList() {
    const Url = `${this.BASE_URL}userrole/menulist`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=============insert user level data=========
  insert_userLevel_Data(ObjData: any) {
    const Url = `${this.BASE_URL}userrole/insert`;
    const reqBody = {
      UserRoles: ObjData[0].userLevelname,
      canVerifyCostingData: ObjData[0].canVerifyCostingData,
      canApproveCostingData: ObjData[0].canApproveCostingData,
      canUploadCostingData: ObjData[0].canUploadCostingData,
      canReprocessCostingData: ObjData[0].canReprocessCostingData,
      UserMenuList: ObjData[0].Menus,
    };
    return this.http.post(Url, reqBody);
  }
  //=============update user level data=========
  update_userLevel_Data(ObjData: any) {
    const Url = `${this.BASE_URL}userrole/update`;
    const reqBody = {
      ID: ObjData[0].userLevelID,
      UserRoles: ObjData[0].userLevelname,
      canVerifyCostingData: ObjData[0].canVerifyCostingData,
      canApproveCostingData: ObjData[0].canApproveCostingData,
      canUploadCostingData: ObjData[0].canUploadCostingData,
      canReprocessCostingData: ObjData[0].canReprocessCostingData,
      UserMenuList: ObjData[0].Menus,
    };
    return this.http.post(Url, reqBody);
  }

  //=====Remove Insurance Data=====
  Remove_userLevel_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}userrole/delete/${id}`, {});
  }

  //==========================================INSURANCE MASTER==========================================================
  //====Insurance List===========
  get_Speciality_List() {
    const Url = `${this.BASE_URL}speciality/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }

  //=====Add Insurance data========
  Insert_Speciality_Data(
    SpecialityCode: any,
    SpecialityName: any,
    SpecialityShortName: any,
    Description: any,
    IsADOCExcluded: any,
  ) {
    const url = `${this.BASE_URL}speciality/insert`;
    const reqBody = {
      SpecialityCode: SpecialityCode,
      SpecialityName: SpecialityName,
      SpecialityShortName: SpecialityShortName,
      Description: Description,
      IsADOCExcluded: IsADOCExcluded,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Insurance data======
  update_Speciality_data(
    id: any,
    SpecialityCode: any,
    SpecialityName: any,
    SpecialityShortName: any,
    Description: any,
    IsADOCExcluded: any,
  ) {
    const url = `${this.BASE_URL}speciality/update`;
    const reqBody = {
      ID: id,
      SpecialityCode: SpecialityCode,
      SpecialityName: SpecialityName,
      SpecialityShortName: SpecialityShortName,
      Description: Description,
      IsADOCExcluded: IsADOCExcluded,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Insurance Data=====
  Remove_Speciality_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}speciality/delete/${id}`, {});
  }

  //==========================================INSURANCE MASTER==========================================================
  //====Insurance List===========
  get_Insurance_List() {
    const Url = `${this.BASE_URL}insurancecompany/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add Insurance data========
  Insert_Insurance_Data(
    InsuranceID: any,
    InsuranceName: any,
    InsuranceShortName: any,
  ) {
    const url = `${this.BASE_URL}insurancecompany/insert`;
    const reqBody = {
      InsuranceID: InsuranceID,
      InsuranceName: InsuranceName,
      InsuranceShortName: InsuranceShortName,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Insurance data======
  update_Insurance_data(
    id: any,
    InsuranceID: any,
    InsuranceName: any,
    InsuranceShortName: any,
  ) {
    const url = `${this.BASE_URL}insurancecompany/update`;
    const reqBody = {
      ID: id,
      InsuranceID: InsuranceID,
      InsuranceName: InsuranceName,
      InsuranceShortName: InsuranceShortName,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Insurance Data=====
  Remove_Insurance_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}insurancecompany/delete/${id}`, {});
  }

  //===================================================FACILITY====================================================
  //=======Fetch All facility data========
  Get_Facility_List_Data() {
    const Url = `${this.BASE_URL}facility/list`;
    const reqBody = {
      list: [],
    };
    return this.http.post(Url, reqBody);
  }

  Get_All_Facility_List_Data() {
    const Url = `${this.BASE_URL}facility/allfacilitylist`;
    const reqBody = {
      list: [],
    };
    return this.http.post(Url, reqBody);
  }

  Get_User_Facility_List_Data(id: any) {
    const url = `${this.BASE_URL}facility/getAllUserFacility?userID=${id}`;
    return this.http.post(url, {});
  }

  //=====Update Facility data====
  update_facility_data(
    id: any,
    FacilityLicense: any,
    FacilityName: any,
    FacilityShortName: any,
    Region: any,
    FacilityTypeID: any,
    FacilityAddress: any,
    PostOfficeID: any,
    RegionID: any,
    EmirateID: any,
    ZoneID: any,
    TypeID: any,
    CategoryID: any,
    KPI: any,
  ) {
    const url = `${this.BASE_URL}facility/update`;
    const reqBody = {
      ID: id,
      FacilityLicense: FacilityLicense,
      FacilityName: FacilityName,
      FacilityShortName: FacilityShortName,
      Region: Region,
      FacilityTypeID: FacilityTypeID,
      FacilityAddress: FacilityAddress,
      PostOfficeID: PostOfficeID,
      RegionID: RegionID,
      EmirateID: EmirateID,
      ZoneID: ZoneID,
      TypeID: TypeID,
      CategoryID: CategoryID,
      KPI: KPI,
    };
    return this.http.post(url, reqBody);
  }

  //=====Remove Facility Data=====
  Remove_Facility_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}facility/delete/${id}`, {});
  }

  //================================================FACILITY TYPE=================================================
  //=====Fetch all Facility Type data======
  Get_Facility_Type_Data() {
    const Url = `${this.BASE_URL}facilitytype/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //====Add facility Type data=======
  Insert_FacilityType_Data(FacilityType: any, description: any) {
    const url = `${this.BASE_URL}facilitytype/insert`;
    const reqBody = {
      FacilityType: FacilityType,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //====Update Facility Type data====
  update_facilityTYPE_data(id: any, FacilityType: any, description: any) {
    const url = `${this.BASE_URL}facilitytype/update`;
    const reqBody = {
      ID: id,
      FacilityType: FacilityType,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //====Remove Facility Type Data=========
  Remove_FacilityType_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}facilitytype/delete/${id}`, {});
  }

  //===================================================FACILITY GROUP============================================
  Get_Facility_Group_Data() {
    const Url = `${this.BASE_URL}facilitygROUP/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add facility group data=====
  Insert_FacilityGroup_Data(
    facilitygroup: any,
    FacilityCategoryValue: any,
    description: any,
  ) {
    const url = `${this.BASE_URL}facilitygroup/insert`;
    const reqBody = {
      FacilityGroup: facilitygroup,
      GroupCategory: FacilityCategoryValue,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //=====Update Facility Group data====
  update_facilityGroup_data(
    id: any,
    facilitygroup: any,
    FacilityCategoryValue: any,
    description: any,
  ) {
    const url = `${this.BASE_URL}facilitygROUP/update`;
    const reqBody = {
      ID: id,
      FacilityGroup: facilitygroup,
      GroupLevel: FacilityCategoryValue,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //===Remove Facility Data==========
  Remove_Facility_Group_Data(id: any) {
    return this.http.post(`${this.BASE_URL}facilitygroup/delete/${id}`, {});
  }

  //================================================FACILITY REGION=================================================
  //=====Fetch all Facility Type data======
  Get_Facility_Region_Data() {
    const Url = `${this.BASE_URL}facilityregion/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //====Add facility Type data=======
  Insert_FacilityRegion_Data(FacilityRegion: any, description: any) {
    const url = `${this.BASE_URL}facilityregion/insert`;
    const reqBody = {
      FacilityRegion: FacilityRegion,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //====Update Facility Type data====
  update_facilityRegion_data(id: any, FacilityRegion: any, description: any) {
    const url = `${this.BASE_URL}facilityregion/update`;
    const reqBody = {
      ID: id,
      FacilityRegion: FacilityRegion,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //====Remove Facility Type Data=========
  Remove_FacilityRegion_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}facilityregion/delete/${id}`, {});
  }

  //==========================================CPT MASTER==========================================================
  //======Cpt Master List===========
  get_CptMaster_List() {
    const Url = `${this.BASE_URL}cptmaster/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }

  //======Add Cpt Master data========
  Insert_CptMaster_Data(
    CPTTypeID: any,
    CPTCode: any,
    CPTName: any,
    CPTPrice: any,
    PriceEffectFrom: any,
    CPTWeightage: any,
    WeightageEffectFrom: any,
    CPTADOCMappings: any,
  ) {
    const url = `${this.BASE_URL}cptmaster/insert`;

    const reqBody = {
      CPTTypeID,
      CPTCode,
      CPTName,
      CPTPrice,
      PriceEffectFrom,
      CPTWeightage,
      WeightageEffectFrom,

      // Default values
      Description: '',
      CPTGroup: '',
      DepartmentID: null,
      CPTDepartmentID: null,
      CostDepartmentID: null,
      CostDriveID: 0,
      FixedQuantity: 0,
      IsDifferentCPTDepartment: 0,
      IsDifferentLedger: 0,
      SelectedLedgerID: null,
      CPTEncounterDepartments: [],
      ADOCClassID: null,
      ADOCGroupID: null,
      data: [],
      // New mapping table
      CPTADOC: (CPTADOCMappings || []).filter(
        (x: any) =>
          x.SpecialityID != null &&
          x.ADOCClassID != null &&
          x.ADOCCategoryID != null,
      ),
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Cpt Master data======
  update_CptMaster_data(
    id: any,
    CPTTypeID: any,
    CPTCode: any,
    CPTName: any,
    CPTADOCMappings: any,
  ) {
    const url = `${this.BASE_URL}cptmaster/update`;

    const reqBody = {
      ID: id,
      CPTTypeID,
      CPTCode,
      CPTName,
      // Default values
      Description: '',
      CPTGroup: '',
      DepartmentID: null,
      CPTDepartmentID: null,
      CostDepartmentID: null,
      CostDriveID: 0,
      FixedQuantity: 0,
      IsDifferentCPTDepartment: 0,
      IsDifferentLedger: 0,
      SelectedLedgerID: null,
      CPTEncounterDepartments: [],
      data: [],
      // New mapping table
      CPTADOC: (CPTADOCMappings || []).filter(
        (x: any) =>
          x.SpecialityID != null &&
          x.ADOCClassID != null &&
          x.ADOCCategoryID != null,
      ),
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Cpt Master Data==========
  Remove_CptMaster_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}cptmaster/delete/${id}`, {});
  }

  selectCptMaster(id: any) {
    return this.http.post(`${this.BASE_URL}cptmaster/select/${id}`, {});
  }

  //==========================================CPY TYPE MASTER==========================================================
  //======Cpt type List===========
  get_CptType_List() {
    const Url = `${this.BASE_URL}CPTtype/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //======Add Cpt type data========
  Insert_CptType_Data(CptType: any, description: any) {
    const url = `${this.BASE_URL}CPTtype/insert`;
    const reqBody = {
      CptType: CptType,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Cpt type data======
  update_CptType_data(id: any, CptType: any, Description: any) {
    const url = `${this.BASE_URL}CPTtype/update`;
    const reqBody = {
      ID: id,
      CptType: CptType,
      Description: Description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Cpt type Data==========
  Remove_CPTType_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}CPTtype/delete/${id}`, {});
  }
  //==========================================Denia MASTER==========================================================

  //====================denials Fetching==================
  getDenialsData() {
    return this.http.post<any>(`${this.BASE_URL}DenialMaster/List`, {});
  }

  //====================Add Denials========================
  addDenial(
    DenialCode: any,
    Description: any,
    DenialTypeID: any,
    DenialCategoryID: any,
  ) {
    const DenialAddData = {
      DenialCode,
      Description,
      DenialTypeID,
      DenialCategoryID,
    };

    return this.http.post(`${this.BASE_URL}DenialMaster/Insert`, DenialAddData);
  }

  //------------update Denial--------------------------
  updateDenial(
    ID: any,
    DenialCode: any,
    Description: any,
    DenialTypeID: any,
    DenialCategoryID: any,
  ) {
    const UpdateData = {
      ID,
      DenialCode,
      Description,
      DenialTypeID,
      DenialCategoryID,
    };

    return this.http.post(`${this.BASE_URL}DenialMaster/Update`, UpdateData);
  }

  //================REmove Denial=========================
  removeDenial(id: any) {
    return this.http.post(`${this.BASE_URL}DenialMaster/delete/${id}`, {});
  }
  //==========================================Denial TYPE MASTER==========================================================
  //======Denial type List===========
  get_DenialType_List() {
    const Url = `${this.BASE_URL}denialtype/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //======Add Denial type data========
  Insert_DenialType_Data(DenialType: any, description: any) {
    const url = `${this.BASE_URL}denialtype/insert`;
    const reqBody = {
      DenialType: DenialType,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Denial type data======
  update_DenialType_data(id: any, DenialType: any, Description: any) {
    const url = `${this.BASE_URL}denialtype/update`;
    const reqBody = {
      ID: id,
      DenialType: DenialType,
      Description: Description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Denial type Data==========
  Remove_DenialType_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}denialtype/delete/${id}`, {});
  }

  //==========================================Denial TYPE MASTER==========================================================
  //======Denial category List===========
  get_DenialCategory_List() {
    const Url = `${this.BASE_URL}denialcategory/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //======Add Denial category data========
  Insert_DenialCategory_Data(DenialCategory: any, description: any) {
    const url = `${this.BASE_URL}denialcategory/insert`;
    const reqBody = {
      DenialCategorys: DenialCategory,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Denial category data======
  update_DenialCategory_data(id: any, DenialCategory: any, Description: any) {
    const url = `${this.BASE_URL}denialcategory/update`;
    const reqBody = {
      ID: id,
      DenialCategorys: DenialCategory,
      Description: Description,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Denial category Data==========
  Remove_DenialCategory_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}denialcategory/delete/${id}`, {});
  }
  //========================================================CLINICIAN=========================================================
  //===========Get all data list========
  get_Clinian_Table_Data() {
    const Url = `${this.BASE_URL}clinician/list`;
    const reqBody = {
      list: [],
    };
    return this.http.post(Url, reqBody);
  }

  //=======insert data ==========
  Insert_Clinician_Data(
    ClinicianLicense: any,
    ClinicianName: any,
    ClinicianShortName: any,
    SpecialityID: any,
    MajorID: any,
    ProfessionID: any,
    CategoryID: any,
    Gender: any,
    DepartmentID: any,
  ) {
    const url = `${this.BASE_URL}clinician/insert`;
    const reqBody = {
      ClinicianLicense: ClinicianLicense,
      ClinicianName: ClinicianName,
      ClinicianShortName: ClinicianShortName,
      SpecialityID: SpecialityID,
      MajorID: MajorID,
      ProfessionID: ProfessionID,
      CategoryID: CategoryID,
      Gender: Gender,
      DepartmentID: DepartmentID,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update Denial category data======
  update_Clinician_data(
    id: any,
    ClinicianLicense: any,
    ClinicianName: any,
    ClinicianShortName: any,
    SpecialityID: any,
    MajorID: any,
    ProfessionID: any,
    CategoryID: any,
    Gender: any,
    DepartmentID: any,
  ) {
    const url = `${this.BASE_URL}clinician/update`;
    const reqBody = {
      ID: id,
      ClinicianLicense: ClinicianLicense,
      ClinicianName: ClinicianName,
      ClinicianShortName: ClinicianShortName,
      SpecialityID: SpecialityID,
      MajorID: MajorID,
      ProfessionID: ProfessionID,
      CategoryID: CategoryID,
      Gender: Gender,
      DepartmentID: DepartmentID,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove Denial category Data==========
  Remove_Clinician_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}clinician/delete/${id}`, {});
  }

  selectClinician(id: any) {
    return this.http.post(`${this.BASE_URL}clinician/select/${id}`, {});
  }

  //===================================================INSURANCE CLASSIFICATION============================================
  Get_InsuranceClassification_Data() {
    const Url = `${this.BASE_URL}insuranceclassification/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add CLASSIFICATION data=====
  Insert_InsuranceClassification_Data(Classification: any, description: any) {
    const url = `${this.BASE_URL}insuranceclassification/insert`;
    const reqBody = {
      Classification: Classification,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //=====Update CLASSIFICATION data====
  update_InsuranceClassification_data(
    id: any,
    Classification: any,
    description: any,
  ) {
    const url = `${this.BASE_URL}insuranceclassification/update`;
    const reqBody = {
      ID: id,
      Classification: Classification,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //===Remove CLASSIFICATION Data==========
  Remove_InsuranceClassification_Data(id: any) {
    return this.http.post(
      `${this.BASE_URL}insuranceclassification/delete/${id}`,
      {},
    );
  }

  //===================================================clinician profession============================================
  Get_ClinicianProfession_Data() {
    const Url = `${this.BASE_URL}clinicianprofession/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add clinicianprofession data=====
  Insert_ClinicianProfession_Data(Profession: any, description: any) {
    const url = `${this.BASE_URL}clinicianprofession/insert`;
    const reqBody = {
      Profession: Profession,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //=====Update clinicianprofession data====
  update_ClinicianProfession_data(id: any, Profession: any, description: any) {
    const url = `${this.BASE_URL}clinicianprofession/update`;
    const reqBody = {
      ID: id,
      Profession: Profession,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //===Remove clinician profession Data==========
  remove_ClinicianProfession(id: any) {
    return this.http.post(
      `${this.BASE_URL}clinicianprofession/delete/${id}`,
      {},
    );
  }

  //===================================================clinician Major============================================
  Get_ClinicianMajor_Data() {
    const Url = `${this.BASE_URL}clinicianmajor/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add clinician Major data=====
  Insert_ClinicianMajor_Data(Major: any, description: any) {
    const url = `${this.BASE_URL}clinicianmajor/insert`;
    const reqBody = {
      Major: Major,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //=====Update clinician Major data====
  update_ClinicianMajor_data(id: any, Major: any, description: any) {
    const url = `${this.BASE_URL}clinicianmajor/update`;
    const reqBody = {
      ID: id,
      Major: Major,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //===Remove clinicianMajor Data==========
  remove_ClinicianMajor(id: any) {
    return this.http.post(`${this.BASE_URL}clinicianmajor/delete/${id}`, {});
  }

  //===================================================clinician Category============================================
  Get_ClinicianCategory_Data() {
    const Url = `${this.BASE_URL}cliniciancategory/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }
  //=====Add clinician Category data=====
  Insert_ClinicianCategory_Data(Category: any, description: any) {
    const url = `${this.BASE_URL}cliniciancategory/insert`;
    const reqBody = {
      Category: Category,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //=====Update clinician category data====
  update_ClinicianCategory_data(id: any, Category: any, description: any) {
    const url = `${this.BASE_URL}cliniciancategory/update`;
    const reqBody = {
      ID: id,
      Category: Category,
      Description: description,
    };

    return this.http.post(url, reqBody);
  }
  //===Remove cliniciancategory Data==========
  remove_ClinicianCategory(id: any) {
    return this.http.post(`${this.BASE_URL}cliniciancategory/delete/${id}`, {});
  }

  getUserSecurityPolicityData() {
    return this.http.post(`${this.BASE_URL}usersecurity/usersecuritylist`, {});
  }
  getCountryList() {
    return this.http.post(
      `http://103.180.120.134/veztaretail/api/country/list`,
      {},
    );
  }

  get_User_data() {
    return this.http.post(`${this.BASE_URL}user/list`, {});
  }
  get_User_Data_By_Id(id: number) {
    return this.http.post(`${this.BASE_URL}user/select/` + id, {});
  }

  insert_User_Data(data: any) {
    const url = `${this.BASE_URL}user/insert`;
    const reqBody = {
      UserName: data.UserName,
      LoginName: data.LoginName,
      Password: data.Password,
      UserRoleID: data.UserRoleID,
      DateofBirth: data.DateofBirth,
      GenderID: data.GenderID,
      Email: data.Email,
      Mobile: data.Mobile,
      Whatsapp: data.Whatsapp,
      LoginExpiryDate: data.LoginExpiryDate,
      IsInactive: data.IsInactive,
      InactiveReason: data.InactiveReason,
      IsLocked: data.IsLocked,
      LockDateFrom: data.LockDateFrom,
      LockDateTo: data.LockDateTo,
      LockReason: data.LockReason,
      PhotoFile: data.PhotoFile,
      user_facility: data.user_facility,
      changePasswordOnLogin: data.changePasswordOnLogin,
      LoginExpiryReason: '',
      Date_Format: data.Date_Format,
      Time_Format: data.Time_Format,
      // Decimal_Points:data.Decimal_Points,
      // Currency_Symbol:data.Currency_Symbol
    };

    return this.http.post(url, reqBody);
  }

  update_User_Data(data: any) {
    const url = `${this.BASE_URL}user/update`;
    const reqBody = {
      UserID: data.UserID,
      UserName: data.UserName,
      LoginName: data.LoginName,
      Password: data.Password,
      UserRoleID: data.UserRoleID,
      DateofBirth: data.DateofBirth,
      GenderID: data.GenderID,
      Email: data.Email,
      Mobile: data.Mobile,
      Whatsapp: data.Whatsapp,
      LoginExpiryDate: data.LoginExpiryDate,
      IsInactive: data.IsInactive,
      InactiveReason: data.InactiveReason,
      IsLocked: data.IsLocked,
      LockDateFrom: data.LockDateFrom,
      LockDateTo: data.LockDateTo,
      LockReason: data.LockReason,
      PhotoFile: data.PhotoFile,
      user_facility: data.user_facility,
      changePasswordOnLogin: data.changePasswordOnLogin,
      LoginExpiryReason: '',
      Date_Format: data.Date_Format,
      Time_Format: data.Time_Format,
      // Decimal_Points:data.Decimal_Points,
      // Currency_Symbol:data.Currency_Symbol
    };

    return this.http.post(url, reqBody);
  }

  remove_User_Data(id: any) {
    return this.http.post(`${this.BASE_URL}user/delete/` + id, {});
  }

  reset_Password(data: any): Observable<any> {
    // Ensure the function returns an Observable<any>
    const url = `${this.BASE_URL}changepassword/password`;

    return this.http.post(url, data);
  }

  getOtp(data: any): Observable<any> {
    const url = `${this.BASE_URL}changepassword/forpassword`;

    return this.http.post(url, data);
  }

  get_Importing_Master_Log_List() {
    const Url = `${this.BASE_URL}importmaster/listimport`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }

  get_Importing_Master_List() {
    const Url = `${this.BASE_URL}importmaster/importmasterlist`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }

  Insert_Imported_Data(data: any) {
    const url = `${this.BASE_URL}importmaster/insert`;
    return this.http.post(url, data);
  }

  get_Imported_Data_By_Id(id: number) {
    return this.http.post(`${this.BASE_URL}importmaster/select/` + id, {});
  }

  //====================Department Fetching==================
  getDepartmentData() {
    return this.http.post<any>(`${this.BASE_URL}department/list`, {});
  }

  //====================Add Department========================
  addDepartment(
    DEPARTMENT: any,
    COST_BUCKET_ID: any,
    COST_CENTER_TYPE_ID: any,
    IS_INACTIVE: any,
    OverheadAllocationType: any,
    OverheadAllocationDepartmentID: any,
  ) {
    const DepartmentAddData = {
      DEPARTMENT,
      COST_BUCKET_ID,
      COST_CENTER_TYPE_ID,
      IS_INACTIVE,
      OverheadAllocationType,
      OverheadAllocationDepartmentID,
    };

    return this.http.post(`${this.BASE_URL}department/save`, DepartmentAddData);
  }

  //------------update Department--------------------------
  updateDepartment(
    ID: any,
    DEPARTMENT: any,
    COST_BUCKET_ID: any,
    COST_CENTER_TYPE_ID: any,
    IS_INACTIVE: any,
    OverheadAllocationType: any,
    OverheadAllocationDepartmentID: any,
  ) {
    const DepartmentUpdateData = {
      ID,
      DEPARTMENT,
      COST_BUCKET_ID,
      COST_CENTER_TYPE_ID,
      IS_INACTIVE,
      OverheadAllocationType,
      OverheadAllocationDepartmentID,
    };

    return this.http.post(
      `${this.BASE_URL}department/Update`,
      DepartmentUpdateData,
    );
  }

  //================REmove Denial=========================
  removeDepartment(id: any) {
    return this.http.post(`${this.BASE_URL}department/delete/${id}`, {});
  }

  selectDepartment(id: any) {
    return this.http.post(`${this.BASE_URL}department/select/${id}`, {});
  }

  //====================Sub-Department Fetching==================
  getSubDepartmentData() {
    return this.http.post<any>(`${this.BASE_URL}subdepartment/list`, {});
  }

  //====================Add Denials========================
  addSubDepartment(SUB_DEPARTMENT: any, DEPARTMENT_ID: any) {
    const DepartmentAddData = {
      SUB_DEPARTMENT,
      DEPARTMENT_ID,
    };

    return this.http.post(
      `${this.BASE_URL}subdepartment/save`,
      DepartmentAddData,
    );
  }

  //------------update Denial--------------------------
  updateSubDepartment(
    ID: any,
    SUB_DEPARTMENT: any,
    DEPARTMENT_ID: any,
    IS_INACTIVE: any,
  ) {
    const DepartmentUpdateData = {
      ID,
      SUB_DEPARTMENT,
      DEPARTMENT_ID,
      IS_INACTIVE,
    };

    return this.http.post(
      `${this.BASE_URL}subdepartment/Update`,
      DepartmentUpdateData,
    );
  }

  //================REmove Denial=========================
  removeSubDepartment(id: any) {
    return this.http.post(`${this.BASE_URL}subdepartment/delete/${id}`, {});
  }

  selectSubDepartment(id: any) {
    return this.http.post(`${this.BASE_URL}subdepartment/select/${id}`, {});
  }

  getSubDepartmentDropDownData(DepartmentID: any) {
    const Data = {
      DepartmentID,
    };

    return this.http.post(`${this.BASE_URL}cptmaster/getSubDepartment`, Data);
  }

  ImportClinicalData(files: any[]) {
    // files is expected to be an array of { fileName, fileData }
    return this.http.post(
      `${this.BASE_URL}ClinicalData/saveImportedFile`,
      files,
    );
  }

  //====================Cpt Costing Department Allocation Fetching==================
  getCptCostingDepartmentAllocationData() {
    return this.http.post<any>(
      `${this.BASE_URL}CptCostingDepartmentAllocation/list`,
      {},
    );
  }

  //====================Add Denials========================
  addCptCostingDepartmentAllocation(data: any) {
    return this.http.post(
      `${this.BASE_URL}CptCostingDepartmentAllocation/save`,
      data,
    );
  }

  //------------update Denial--------------------------
  updateCptCostingDepartmentAllocation(data: any) {
    return this.http.post(
      `${this.BASE_URL}CptCostingDepartmentAllocation/update`,
      data,
    );
  }

  //================REmove Denial=========================
  removeCptCostingDepartmentAllocation(id: any) {
    return this.http.post(
      `${this.BASE_URL}CptCostingDepartmentAllocation/delete/${id}`,
      {},
    );
  }

  selectCptCostingDepartmentAllocation(id: any) {
    return this.http.post(
      `${this.BASE_URL}CptCostingDepartmentAllocation/select/${id}`,
      {},
    );
  }

  exportReport(payload: any) {
    return this.http.post(`${this.BASE_URL}exportreport/export`, payload, {
      responseType: 'blob', // 🔥 VERY IMPORTANT
    });
  }

  // ================= ADCO GROUP ============
  //====ADCO GROUP List===========
  get_adocGroup_List() {
    const Url = `${this.BASE_URL}ADOCGroup/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }

  //=====Add ADCO GROUP data========
  Insert_adocGroup_Data(
    Code: any,
    Name: any,
    IsChargeable: any,
    IsInactive: any,
  ) {
    const url = `${this.BASE_URL}ADOCGroup/save`;
    const reqBody = {
      GroupCode: Code,
      GroupName: Name,
      IsChargeable: IsChargeable,
      IsInactive: IsInactive,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update ADCO GROUP data======
  update_adocGroup_data(
    id: any,
    Code: any,
    Name: any,
    IsChargeable: any,
    IsInactive: any,
  ) {
    const url = `${this.BASE_URL}ADOCGroup/update`;
    const reqBody = {
      ID: id,
      GroupCode: Code,
      GroupName: Name,
      IsChargeable: IsChargeable,
      IsInactive: IsInactive,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove ADCO GROUP Data=====
  Remove_adocGroupList_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}ADOCGroup/delete/${id}`, {});
  }

  // ================= ADCO Class ============
  //====ADCO Class List===========
  get_adocClass_List() {
    const Url = `${this.BASE_URL}ADOCClass/list`;
    const reqBody = {
      list: [],
    };

    return this.http.post(Url, reqBody);
  }

  //=====Add ADCO Class data========
  Insert_adocClass_Data(Code: any, Name: any, GroupID: any, IsInactive: any) {
    const url = `${this.BASE_URL}ADOCClass/save`;
    const reqBody = {
      ClassCode: Code,
      ClassName: Name,
      GroupID: GroupID,
      IsInactive: IsInactive,
    };

    return this.http.post(url, reqBody);
  }

  //=====Update ADCO Class data======
  update_adocClass_data(
    id: any,
    Code: any,
    Name: any,
    GroupID: any,
    IsInactive: any,
  ) {
    const url = `${this.BASE_URL}ADOCClass/update`;
    const reqBody = {
      ID: id,
      ClassCode: Code,
      ClassName: Name,
      GroupID: GroupID,
      IsInactive: IsInactive,
    };

    return this.http.post(url, reqBody);
  }

  //=====Remove ADCO Class Data=====
  Remove_adocClass_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}ADOCClass/delete/${id}`, {});
  }

  //============ ADOC detailed data fetching ========
  fetch_ADOC_Detailed_data(Id: any) {
    const url = `${this.BASE_URL}ADOCClass/cptlist`;
    const reqBody = {
      ADOCClassID: Id,
    };

    return this.http.post(url, reqBody);
  }
  // ================= Price Master =================
  // ===== Get Price Master List =====
  get_PriceMaster_List() {
    const url = `${this.BASE_URL}price/list`;
    return this.http.post(url, {});
  }

  // ===== Get CPT-Price List =====
  get_CPT_Price_List(facilityId: any) {
    const url = `${this.BASE_URL}Price/cptlist`;
    const payload = {
      FacilityID: facilityId,
    };
    return this.http.post(url, payload);
  }

  // ===== Get CPT-Price List =====
  get_CPT_Weightage_List(facilityId: any) {
    const url = `${this.BASE_URL}cptweightage/cptlist`;
    const payload = {
      FacilityID: facilityId,
    };
    return this.http.post(url, payload);
  }

  // ===== Add Price Master =====
  Insert_PriceMaster_Data(payload: any) {
    const url = `${this.BASE_URL}price/save`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }

  // ===== Update Price Master =====
  update_PriceMaster_Data(
    ID: any,
    FacilityID: any,
    CPTCode: any,
    Price: any,
    EffectFrom: any,
    RevisedOn: any,
    IsInactive: any,
  ) {
    const url = `${this.BASE_URL}price/update`;

    const reqBody = {
      ID: ID,
      FacilityID: FacilityID,
      CPTID: CPTCode,
      Price: Price,
      EffectFrom: this.formatDate(EffectFrom),
      EffectTo: this.formatDate(RevisedOn),
      IsInactive: IsInactive,
    };

    return this.http.post(url, reqBody);
  }

  // ===== Delete Price Master =====
  Remove_PriceMaster_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}price/delete/${id}`, {});
  }

  // ================= Price Master =================
  // ===== Get Price Master List =====
  get_CPTWeightage_List() {
    const url = `${this.BASE_URL}CPTWeightage/list`;
    return this.http.post(url, {});
  }

  // ===== Add Price Master =====
  Insert_CPTWeightage_Data(payload: any) {
    const url = `${this.BASE_URL}CPTWeightage/save`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }

  // ===== Update Price Master =====
  update_CPTWeightage_Data(
    ID: any,
    FacilityID: any,
    CPTCode: any,
    Weightage: any,
    EffectFrom: any,
    RevisedOn: any,
    IsInactive: any,
  ) {
    const url = `${this.BASE_URL}CPTWeightage/update`;

    const reqBody = {
      ID: ID,
      FacilityID: FacilityID,
      CPTID: CPTCode,
      Weightage: Weightage,
      EffectFrom: this.formatDate(EffectFrom),
      EffectTo: this.formatDate(RevisedOn),
      IsInactive: IsInactive,
    };

    return this.http.post(url, reqBody);
  }

  // ===== Delete Price Master =====
  Remove_CPTWeightage_Row_Data(id: any) {
    return this.http.post(`${this.BASE_URL}CPTWeightage/delete/${id}`, {});
  }

  formatDate(dateString: any) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get_ADOC_CountingRule_List() {
    const Url = `${this.BASE_URL}ADOCGroup/adoc-rule-list`;
    return this.http.post(Url, {});
  }
}
