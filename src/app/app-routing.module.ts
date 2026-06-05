import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import {
  LoginFormComponent,
  ResetPasswordFormComponent,
  CreateAccountFormComponent,
  ChangePasswordFormComponent,
} from './components';
import { AuthGuardService } from './services';
import {
  SideNavOuterToolbarComponent,
  UnauthenticatedContentComponent,
} from './layouts';
import { AnalyticsDashboardComponent } from './pages/HOME/analytics-dashboard/analytics-dashboard.component';
import { AppSignInComponent } from './pages/sign-in-form/sign-in-form.component';
import { AppSignUpComponent } from './pages/sign-up-form/sign-up-form.component';
import { AppResetPasswordComponent } from './pages/reset-password-form/reset-password-form.component';
import { CPTMasterComponent } from './pages/MASTER PAGES/cpt-master/cpt-master.component';
import { SpecialityComponent } from './pages/MASTER PAGES/speciality/speciality.component';
import { CPTTypeComponent } from './pages/MASTER PAGES/cpt-type/cpt-type.component';
import { FacilityTypeComponent } from './pages/MASTER PAGES/facility-type/facility-type.component';
import { ClinicianComponent } from './pages/MASTER PAGES/clinician/clinician.component';
import { ClinicianMajorComponent } from './pages/MASTER PAGES/clinician-major/clinician-major.component';
import { ClinicianProfessionComponent } from './pages/MASTER PAGES/clinician-profession/clinician-profession.component';
import { ClinicianCategoryComponent } from './pages/MASTER PAGES/clinician-category/clinician-category.component';
import { SecurityPolicyComponent } from './pages/SYSTEM PAGES/security-policy/security-policy.component';
import { UserLevelMasterComponent } from './pages/MASTER PAGES/user-role-master/user-role-master.component';
import { UserComponent } from './pages/MASTER PAGES/user/user.component';
import { ChangePasswordComponent } from './pages/PROFILE PAGES/change-password/change-password.component';
import { FacilityRegionComponent } from './pages/MASTER PAGES/facility-region/facility-region.component';
import { FacilityGroupListComponent } from './pages/MASTER PAGES/facility-group/facility-group-list.component';
import { ImportMasterDataComponent } from './pages/MASTER PAGES/import-master-data/import-master-data.component';
import { DepartmentListComponent } from './pages/MASTER PAGES/department/department-list.component';
import { FacilityListComponent } from './pages/MASTER PAGES/facility/facility-list.component';
import { AutoDownloadSettingsComponent } from './pages/ACTIVITY/download-settings/auto-download-settings.component';
import { DownloadLogViewComponent } from './pages/LOGS/download-log-view/download-log-view.component';
import { PostOfficeCredentialsComponent } from './pages/SYSTEM PAGES/post-office-credentials/post-office-credentials.component';
import { LicenseInfoComponent } from './pages/SYSTEM PAGES/license-info/license-info.component';
import { NotificationSettingsComponent } from './pages/SYSTEM PAGES/notificarion-settings/notificarion-settings.component';
import { EmailLogDataComponent } from './pages/SYSTEM PAGES/Report-Email-Schedule/email-log-data.component';
import { SubDepartmentListComponent } from './pages/MASTER PAGES/Sub-department/sub-department-list.component';

import { FinanceDataComponent } from './pages/OPERATION PAGES/finance-data/finance-data.component';
import { ProcessComponent } from './pages/OPERATION PAGES/process/process.component';
import { AccountsListComponent } from './pages/ACCOUNTS/accounts-list/accounts-list.component';
import { TwoStepVerificationComponent } from './components/library/two-step-verification/two-step-verification.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { CPTCostingDepartmentAllocationComponent } from './pages/MASTER PAGES/cpt-costing-department-allocation/cpt-costing-department-allocation.component';
import { LedgerGroupComponent } from './pages/ACCOUNTS/ledger-group/ledger-group.component';
import { ClinicalDataComponent } from './pages/OPERATION PAGES/clinical-data/clinical-data.component';
import { ADOCClassComponent } from './pages/MASTER PAGES/adoc-class/adoc-class.component';
import { PriceMasterComponent } from './pages/MASTER PAGES/price-master/price-master.component';
import { ADOCGroupComponent } from './pages/MASTER PAGES/adoc-category/adoc-group.component';
import { CPTWeightageComponent } from './pages/MASTER PAGES/cpt-weightage/cpt-weightage.component';
import { AdocCountingRulesComponent } from './pages/MASTER PAGES/adoc-counting-rules/adoc-counting-rules.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    component: UnauthenticatedContentComponent,
    children: [
      {
        path: 'login',
        component: LoginFormComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'reset-password',
        component: ResetPasswordFormComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'create-account',
        component: CreateAccountFormComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'change-password/:recoveryCode',
        component: ChangePasswordFormComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'two-step-verification',
        component: TwoStepVerificationComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: '**',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    component: SideNavOuterToolbarComponent,
    children: [
      {
        path: 'post-office-credentials',
        component: PostOfficeCredentialsComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'security-policy',
        component: SecurityPolicyComponent,
        canActivate: [AuthGuardService],
      },

      {
        path: 'license-info-page',
        component: LicenseInfoComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'notification-settings-page',
        component: NotificationSettingsComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'Email-Log-Scheduling',
        component: EmailLogDataComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'clinician-major',
        component: ClinicianMajorComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'clinician-profession',
        component: ClinicianProfessionComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'clinician-category',
        component: ClinicianCategoryComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'clinicians',
        component: ClinicianComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'user-levels-Master',
        component: UserLevelMasterComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'user',
        component: UserComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'change-password',
        component: ChangePasswordComponent,
      },
      {
        path: 'ctp-master-page',
        component: CPTMasterComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'cpt-type',
        component: CPTTypeComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'costing-department-allocation',
        component: CPTCostingDepartmentAllocationComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'speciality',
        component: SpecialityComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'accounts',
        component: AccountsListComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'ledger-group',
        component: LedgerGroupComponent,
        canActivate: [AuthGuardService],
      },

      {
        path: 'facility-page',
        component: FacilityListComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'facility-group-page',
        component: FacilityGroupListComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'facility-type',
        component: FacilityTypeComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'facility-region-page',
        component: FacilityRegionComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'analytics-dashboard',
        component: AnalyticsDashboardComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'sign-in-form',
        component: AppSignInComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'sign-up-form',
        component: AppSignUpComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'reset-password-form',
        component: AppResetPasswordComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'import-master-data',
        component: ImportMasterDataComponent,
        canActivate: [AuthGuardService],
      },

      {
        path: 'Auto-Download-Settings-Page',
        component: AutoDownloadSettingsComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'download-log-view-page',
        component: DownloadLogViewComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'department',
        component: DepartmentListComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'sub-department',
        component: SubDepartmentListComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'clinical-data',
        component: ClinicalDataComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'finance-data',
        component: FinanceDataComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'process',
        component: ProcessComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'adoc-class',
        component: ADOCClassComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'adoc-group',
        component: ADOCGroupComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'adoc-counting-rules',
        component: AdocCountingRulesComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'price',
        component: PriceMasterComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'cpt-weightage',
        component: CPTWeightageComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'about',
        component: AboutPageComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: '**',
        redirectTo: 'analytics-dashboard',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true }), BrowserModule],
  providers: [AuthGuardService],
  exports: [RouterModule],
  declarations: [],
})
export class AppRoutingModule {}
