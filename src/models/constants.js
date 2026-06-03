export const DEFAULT_RECIPIENTS_UAT = [
  'Aswajith.P@citybees.ae',
  'Libin.B@citybees.ae',
  'J.Joy@miskprops.com',
  'Nishana.S@citybees.ae',
  'Kavishka.D@citybees.ae',
  'athul.k@webandcrafts.com',
  'ebenezer@webandcrafts.com',
  'vinu.b@webandcrafts.com',
  'shilpa.v@webandcrafts.com',
  'ajesh.u@webandcrafts.in',
];

export const DEFAULT_RECIPIENTS_WAC = [
  'Libin.B@citybees.ae',
  'Aswajith.P@citybees.ae',
];

export const UAT_MODULES = [
  {
    id: 'Citybees-requestor-dashboard',
    appName: 'Citybees-requestor-dashboard',
    gitlabRepo: 'wac0220250052-citybees-admin-dashboard-uitw-react',
    githubBranch: 'staging-test',
    gitlabTestBranch: 'uat-test/requester-dashboard',
    gitlabProdBranch: 'release/requester-dashboard',
    pushBranchTest: 'requester-dashboard-stage-test',
    pushBranchProd: 'requester-dashboard-stage-prod',
    isBackend: false,
  },
  {
    id: 'Citybees-provider-dashboard',
    appName: 'Citybees-provider-dashboard',
    gitlabRepo: 'wac0220250052-citybees-admin-dashboard-uitw-react',
    githubBranch: 'staging-test',
    gitlabTestBranch: 'uat-test/provider-dashboard',
    gitlabProdBranch: 'release/provider-dashboard',
    pushBranchTest: 'provider-dashboard-stage-test',
    pushBranchProd: 'provider-dashboard-stage-prod',
    isBackend: false,
  },
  {
    id: 'Citybees-admin-dashboard',
    appName: 'Citybees-admin-dashboard',
    gitlabRepo: 'wac0220250052-citybees-admin-dashboard-uitw-react',
    githubBranch: 'staging-test',
    gitlabTestBranch: 'uat-test/admin-dashboard',
    gitlabProdBranch: 'release/admin-dashboard',
    pushBranchTest: 'admin-dashboard-stage-test',
    pushBranchProd: 'admin-dashboard-stage-prod',
    isBackend: false,
  },
  {
    id: 'Citybees-Backend',
    appName: 'Citybees-Backend',
    gitlabRepo: 'wac0220250052-citybees-realestatemanagement-nodejs',
    githubBranch: 'staging-test',
    gitlabTestBranch: 'uat-test',
    gitlabProdBranch: 'release',
    pushBranchTest: 'backend-stage-test',
    pushBranchProd: 'backend-stage-prod',
    isBackend: true,
  },
];

export const WAC_MODULES = [
  {
    id: 'Citybees-requestor-dashboard',
    appName: 'Citybees-requestor-dashboard',
    gitlabBranch: 'release/requester-dashboard',
    githubBranch: 'WAC-prod-branch',
    isBackend: false,
  },
  {
    id: 'Citybees-provider-dashboard',
    appName: 'Citybees-provider-dashboard',
    gitlabBranch: 'release/provider-dashboard',
    githubBranch: 'WAC-prod-branch',
    isBackend: false,
  },
  {
    id: 'Citybees-admin-dashboard',
    appName: 'Citybees-admin-dashboard',
    gitlabBranch: 'release/admin-dashboard',
    githubBranch: 'WAC-prod-branch',
    isBackend: false,
  },
  {
    id: 'Citybees-Backend',
    appName: 'Citybees-Backend',
    gitlabBranch: 'release',
    githubBranch: 'WAC-prod-branch',
    isBackend: true,
  },
];
