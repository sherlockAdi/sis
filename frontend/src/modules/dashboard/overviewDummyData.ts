export type DepartmentKey =
  | "UI/UX"
  | "Development"
  | "Management"
  | "HR"
  | "Testing"
  | "Marketing";

export type EmployeeAttendanceStatus = "Present" | "Late" | "Permission" | "Absent";

export type ClockItem = {
  id: string;
  name: string;
  title: string;
  status: "On Time" | "Late";
  clockIn: string;
  clockOut: string;
  production: string;
};

export type ApplicantItem = {
  id: string;
  name: string;
  exp: string;
  country: string;
  role: string;
  roleColor: "blue" | "teal" | "purple" | "gray";
};

export type TodoItem = {
  id: string;
  title: string;
  dueLabel: string;
  done: boolean;
};

export function createOverviewDummyData() {
  const kpis = [
    { key: "attendance", label: "Attendance Overview", value: "120/154", helper: "View Details", tone: "orange" as const },
    { key: "projects", label: "Total No of Project's", value: "90/125", helper: "View All", tone: "teal" as const },
    { key: "clients", label: "Total No of Clients", value: "69/86", helper: "View All", tone: "blue" as const },
    { key: "tasks", label: "Total No of Tasks", value: "225/28", helper: "View All", tone: "pink" as const },
    { key: "earnings", label: "Earnings", value: "$21445", helper: "View All", tone: "purple" as const },
    { key: "profit", label: "Profit This Week", value: "$5,544", helper: "View All", tone: "red" as const },
    { key: "applicants", label: "Job Applicants", value: "98", helper: "View All", tone: "green" as const },
    { key: "newHire", label: "New Hire", value: "45/48", helper: "View All", tone: "slate" as const },
  ];

  const departments: { dept: DepartmentKey; count: number }[] = [
    { dept: "UI/UX", count: 80 },
    { dept: "Development", count: 112 },
    { dept: "Management", count: 78 },
    { dept: "HR", count: 20 },
    { dept: "Testing", count: 60 },
    { dept: "Marketing", count: 100 },
  ];

  const attendance = {
    total: 154,
    present: 120,
    late: 21,
    permission: 2,
    absent: 15,
  };

  const clockItems: ClockItem[] = [
    {
      id: "clk-1",
      name: "Daniel Esbella",
      title: "UI/UX Designer",
      status: "On Time",
      clockIn: "10:30 AM",
      clockOut: "09:45 AM",
      production: "09:21 Hrs",
    },
    {
      id: "clk-2",
      name: "Doglas Martini",
      title: "Project Manager",
      status: "On Time",
      clockIn: "10:30 AM",
      clockOut: "09:45 AM",
      production: "09:36 Hrs",
    },
    {
      id: "clk-3",
      name: "Brian Villalobos",
      title: "PHP Developer",
      status: "On Time",
      clockIn: "10:30 AM",
      clockOut: "09:45 AM",
      production: "09:15 Hrs",
    },
    {
      id: "clk-4",
      name: "Anthony Lewis",
      title: "Marketing Head",
      status: "Late",
      clockIn: "10:42 AM",
      clockOut: "—",
      production: "08:35 Hrs",
    },
  ];

  const applicants: ApplicantItem[] = [
    { id: "app-1", name: "Brian Villalobos", exp: "5+ Years", country: "USA", role: "UI/UX Designer", roleColor: "teal" },
    { id: "app-2", name: "Anthony Lewis", exp: "4+ Years", country: "USA", role: "Python Developer", roleColor: "blue" },
    { id: "app-3", name: "Stephan Peralt", exp: "6+ Years", country: "USA", role: "Android Developer", roleColor: "purple" },
    { id: "app-4", name: "Doglas Martini", exp: "2+ Years", country: "USA", role: "React Developer", roleColor: "gray" },
  ];

  const todos: TodoItem[] = [
    { id: "todo-1", title: "Add Holidays", dueLabel: "Today", done: false },
    { id: "todo-2", title: "Review Job Postings", dueLabel: "Today", done: false },
    { id: "todo-3", title: "Approve Leave Requests", dueLabel: "This Week", done: true },
    { id: "todo-4", title: "Schedule Interviews", dueLabel: "This Week", done: false },
  ];

  return {
    kpis,
    departments,
    attendance,
    clockItems,
    applicants,
    todos,
  };
}

