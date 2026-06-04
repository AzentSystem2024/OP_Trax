import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/services/config.service';

@Injectable({
  providedIn: 'root',
})
export class OperationReportService {
  constructor(
    private http: HttpClient,
    private config: ConfigService,
  ) {}

  private get BASE_URL(): string {
    return this.config.apiBaseUrl;
  }

  getClinicalData(payload: any) {
    const reqBody = payload;
    return this.http.post<any>(`${this.BASE_URL}ClinicalData/list`, reqBody);
  }

    getClinicalDataInPopup(payload: any) {
    const reqBody = payload;
    return this.http.post<any>(`${this.BASE_URL}ClinicalData/getActivityData`, reqBody);
  }

    get_ReProcess_ClinicalDataInPopup(payload: any) {
    const reqBody = payload;
    return this.http.post<any>(`${this.BASE_URL}ClinicalData/reprocess`, reqBody);
  }

  Insert_Clinical_Data_Excel_Import(data: any) {
    const url = `${this.BASE_URL}ClinicalData/saveImportedExcel`;
    return this.http.post(url, data);
  }

  Insert_Finance_Data_Import(data: any) {
    const url = `${this.BASE_URL}FinanceDataImport/insert`;
    return this.http.post(url, data);
  }

  getFinanceDataImportLog() {
    // const reqBody = payload;
    return this.http.post<any>(`${this.BASE_URL}FinanceDataImport/list`, {});
  }

  getFinanceDataImportData(id: number) {
    const data = {
      ID: id,
    };
    return this.http.post(`${this.BASE_URL}FinanceDataImport/select`, data);
  }

  update_Finance_Data_Status(data: any) {
    const url = `${this.BASE_URL}FinanceDataImport/updatestatus`;
    return this.http.post(url, data);
  }

  getProcessFinanceData(data: any) {
    return this.http.post(
      `${this.BASE_URL}ClinicalCostingProcess/getFinanceData`,
      data,
    );
  }

  // ========== finance data ==============
  processFinanceData(data: any) {
    return this.http.post(
      `${this.BASE_URL}ClinicalCostingProcess/process`,
      data,
    );
  }

  // ========== finance data clear ==============
  process_Data_Clear() {
    return this.http.post(
      `${this.BASE_URL}ClinicalCostingProcess/clearProcess`,
      {},
    );
  }

  // ========== finance data validate data ==============
  Validate_process_Data(payload: any) {
    return this.http.post(
      `${this.BASE_URL}ClinicalCostingProcess/validateProcess`,
      payload,
    );
  }

  // ========== finance data begin process ==============
  Begin_process_Data(payload: any) {
    return this.http.post(
      `${this.BASE_URL}ClinicalCostingProcess/processBegin`,
      payload,
    );
  }

  // ========== finance data processing ==============
  Process_process_Data(payload: any) {
    return this.http.post(
      `${this.BASE_URL}ClinicalCostingProcess/processBatch`,
      payload,
    );
  }

  // ========== finance data processing ==============
  Finish_process_Data(payload: any) {
    return this.http.post(
      `${this.BASE_URL}ClinicalCostingProcess/processFinish`,
      payload,
    );
  }

  getClinicalCostingList(userid: any) {
    const data = {
      UserID: userid,
    };
    return this.http.post<any>(
      `${this.BASE_URL}ClinicalCostingProcess/list`,
      data,
    );
  }

  removeClinicalCostingData(id: any) {
    return this.http.post(
      `${this.BASE_URL}ClinicalCostingProcess/delete/${id}`,
      {},
    );
  }

  get_costView_Report_Data(ProcessID: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/getCostViewReport`;
    const reqBody = {
      ProcessID: ProcessID,
    };
    return this.http.post(url, reqBody);
  }
  // =========== generate XML data ========
  generate_XML_Data(InputData: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/generateXML`;
    const reqBody = InputData;
    return this.http.post(url, reqBody);
  }
  // ===== fetch all generated xml file ======
  fetch_generated_XML_Data(processID: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/getXmlData`;
    const reqBody = { ProcessID: processID };
    return this.http.post(url, reqBody);
  }

  // ===== fetch all generated xml file ======
  download_XML_error_Data(XMLFileID: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/downloadErrorReport`;
    const reqBody = { XMLFileID: XMLFileID };
    return this.http.post(url, reqBody);
  }
  // =========== upload XML data ========
  upload_XML_Data(InputData: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/uploadXml`;
    const reqBody = InputData;
    return this.http.post(url, reqBody);
  }

  // ========== verify clinical costing data ==========
  verify_Costing_Data(processID: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BASE_URL}ClinicalCostingProcess/verify`;
    const reqBody = {
      ProcessID: processID,
      UserID: userid,
    };
    return this.http.post(url, reqBody);
  }

  // ========== approve clinical costing data ==========
  approve_Costing_Data(processID: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BASE_URL}ClinicalCostingProcess/approve`;
    const reqBody = {
      ProcessID: processID,
      UserID: userid,
    };
    return this.http.post(url, reqBody);
  }

  // ========== delete clinical costing data ==========
  delete_Costing_Data(processID: any) {
    const userid = sessionStorage.getItem('UserID');
    const url = `${this.BASE_URL}ClinicalCostingProcess/delete`;
    const reqBody = {
      ProcessID: processID,
      UserID: userid,
    };
    return this.http.post(url, reqBody);
  }

  // =========== allocate clinical data =============

  allocate_Clinical_Data(InputData: any) {
    const url = `${this.BASE_URL}ClinicalData/allocate`;
    const reqBody = InputData;
    return this.http.post(url, reqBody);
  }

  // ============ fetch selected clinical cpt code data =============
  fetch_selected_CptCode_Data(code: any) {
    return this.http.post(`${this.BASE_URL}ClinicalData/selectCpt/${code}`, {});
  }

  // ============ fetch selected clinical cpt code data =============
  fetch_selected_orderingClinician_Data(clinicianID: any) {
    return this.http.post(
      `${this.BASE_URL}ClinicalData/selectClinician/${clinicianID}`,
      {},
    );
  }

  //============updating qty weight. by importing data============

  Import_QtyWeight_Update(payload: any) {
    const url = `${this.BASE_URL}ClinicalData/QtyWeightImport`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }

  get_clinical_costing_data_popup_data(payload: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/costview-details`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }

  // ============= fetch xml data of clicked row ===============
  get_clicked_Row_Xml_data(payload: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/getSingleXmlData`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }

  // ============= fetch xml data of clicked row ===============
  update_clicked_Row_Xml_data(payload: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/updateXmlData`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }

  // ============= re-generate XML data ===============
  regenerate_Row_Xml_data(payload: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/regenerateXmlData`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }
  // ============= costing edit get data ===============
  fetch_Costing_Edit_Data(formData: any) {
    const url = `${this.BASE_URL}CostingEdit/getFinanceEntryData`;
    const reqBody = formData;
    return this.http.post(url, reqBody);
  }

  //=============update allocated cost ==============

  updateAllocatedCost(payload: any) {
    const url = `${this.BASE_URL}CostingEdit/updateCost`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }

  //==========getPendingBatches For Process Resume ==========

  resume_Process_Data(payload: any) {
    const url = `${this.BASE_URL}ClinicalCostingProcess/getPendingBatches`;
    const reqBody = payload;
    return this.http.post(url, reqBody);
  }
}
