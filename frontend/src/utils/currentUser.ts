import { reactive } from "vue";

/** 当前操作人：由页面右上角角色切换器写入，请求时透传给后端 RBAC。 */
export const currentUser = reactive({
  id: "u2001",
  name: "审批员·李敏",
  role: "APPROVER"
});

export const ROLE_OPTIONS = [
  { id: "u1001", name: "仓库员·王强", role: "WAREHOUSE_KEEPER" },
  { id: "u2001", name: "审批员·李敏", role: "APPROVER" },
  { id: "u3001", name: "街道管理员·赵芳", role: "ADMIN" },
  { id: "u4001", name: "只读观察员·陈默", role: "VIEWER" }
] as const;

export function setCurrentUser(id: string, name: string, role: string) {
  currentUser.id = id;
  currentUser.name = name;
  currentUser.role = role;
}
