export class OrgDetailsDto {
    orgId: number;
    orgName: string;
    orgAdminFirstName: string;
    orgAdminLastName: string;
    communitiesCount: number;
    landlordsCount: number;
    tenantsCount: number;
}

export class DashboardDto {
    totals: {
        organizations: number;
        communities: number;
        landlords: number;
        tenants: number;
    };
    adminOrgDetails: OrgDetailsDto[];
}
