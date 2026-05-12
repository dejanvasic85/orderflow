export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff" | "user";
  status: "active" | "invite_pending";
  phone: string | null;
  notification_preferences: { email: boolean; sms: boolean };
  accounts: { id: string; name: string }[];
};

export const mockAccounts = [
  { id: "a1", name: "The Winery Bistro" },
  { id: "a2", name: "Cellar Door Co." },
  { id: "a3", name: "Harvest Table" },
  { id: "a4", name: "Vine & Barrel" },
  { id: "a5", name: "The Cork Room" },
];

export const mockUsers: MockUser[] = [
  {
    id: "u1",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    role: "admin",
    status: "active",
    phone: null,
    notification_preferences: { email: true, sms: false },
    accounts: [],
  },
  {
    id: "u2",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@example.com",
    role: "staff",
    status: "active",
    phone: null,
    notification_preferences: { email: true, sms: true },
    accounts: [
      { id: "a1", name: "The Winery Bistro" },
      { id: "a2", name: "Cellar Door Co." },
    ],
  },
  {
    id: "u3",
    name: "Tom Reynolds",
    email: "tom.reynolds@example.com",
    role: "user",
    status: "active",
    phone: null,
    notification_preferences: { email: false, sms: false },
    accounts: [{ id: "a3", name: "Harvest Table" }],
  },
  {
    id: "u4",
    name: "Priya Nair",
    email: "priya.nair@example.com",
    role: "user",
    status: "invite_pending",
    phone: null,
    notification_preferences: { email: true, sms: false },
    accounts: [],
  },
  {
    id: "u5",
    name: "Marcus Bell",
    email: "marcus.bell@example.com",
    role: "staff",
    status: "active",
    phone: null,
    notification_preferences: { email: true, sms: true },
    accounts: [
      { id: "a4", name: "Vine & Barrel" },
      { id: "a5", name: "The Cork Room" },
    ],
  },
  {
    id: "u6",
    name: "Olivia Chen",
    email: "olivia.chen@example.com",
    role: "user",
    status: "invite_pending",
    phone: null,
    notification_preferences: { email: false, sms: false },
    accounts: [],
  },
];
