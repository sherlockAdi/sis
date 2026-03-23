export type WorkflowStageId =
  | "inbox"
  | "screening"
  | "interview"
  | "documentation"
  | "deployment"
  | "done";

export type WorkflowPriority = "Low" | "Medium" | "High" | "Critical";

export type WorkflowItemStatus = "Open" | "Blocked" | "On Hold";

export type WorkflowModule = "Recruitment" | "Documentation" | "Deployment" | "Payments";

export type WorkflowStage = {
  id: WorkflowStageId;
  label: string;
  wipLimit?: number;
};

export type WorkflowItem = {
  id: string;
  refNo: string;
  title: string;
  module: WorkflowModule;
  stageId: WorkflowStageId;
  priority: WorkflowPriority;
  status: WorkflowItemStatus;
  assignee: string;
  dueDate: string; // ISO string
  createdAt: string; // ISO string
  tags: string[];
  blockedReason?: string;
};

export const workflowStages: WorkflowStage[] = [
  { id: "inbox", label: "Inbox", wipLimit: 10 },
  { id: "screening", label: "Screening", wipLimit: 8 },
  { id: "interview", label: "Interview", wipLimit: 6 },
  { id: "documentation", label: "Documentation", wipLimit: 7 },
  { id: "deployment", label: "Deployment", wipLimit: 5 },
  { id: "done", label: "Done" },
];

export function createDummyWorkflowItems(now = new Date()): WorkflowItem[] {
  const iso = (d: Date) => d.toISOString();
  const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return [
    {
      id: "wf-1001",
      refNo: "APP-24031",
      title: "Shortlist for Warehouse Supervisor (UAE)",
      module: "Recruitment",
      stageId: "inbox",
      priority: "High",
      status: "Open",
      assignee: "Asha",
      dueDate: iso(addDays(1)),
      createdAt: iso(addDays(-2)),
      tags: ["UAE", "Warehouse"],
    },
    {
      id: "wf-1002",
      refNo: "APP-24032",
      title: "Verify documents: Passport & PCC",
      module: "Documentation",
      stageId: "documentation",
      priority: "Critical",
      status: "Blocked",
      assignee: "Rahul",
      dueDate: iso(addDays(-1)),
      createdAt: iso(addDays(-6)),
      tags: ["PCC", "Passport"],
      blockedReason: "Awaiting original PCC from candidate",
    },
    {
      id: "wf-1003",
      refNo: "CAN-11908",
      title: "Schedule Interview (Video): Electrician",
      module: "Recruitment",
      stageId: "interview",
      priority: "Medium",
      status: "Open",
      assignee: "Meera",
      dueDate: iso(addDays(2)),
      createdAt: iso(addDays(-1)),
      tags: ["Video", "Electrician"],
    },
    {
      id: "wf-1004",
      refNo: "JOB-7831",
      title: "Finalize job offer package",
      module: "Recruitment",
      stageId: "screening",
      priority: "High",
      status: "On Hold",
      assignee: "Asha",
      dueDate: iso(addDays(3)),
      createdAt: iso(addDays(-4)),
      tags: ["Offer", "Compensation"],
    },
    {
      id: "wf-1005",
      refNo: "DEP-5502",
      title: "Book flight tickets (Batch #12)",
      module: "Deployment",
      stageId: "deployment",
      priority: "High",
      status: "Open",
      assignee: "Rahul",
      dueDate: iso(addDays(0)),
      createdAt: iso(addDays(-3)),
      tags: ["Travel", "Batch-12"],
    },
    {
      id: "wf-1006",
      refNo: "PAY-9007",
      title: "Collect processing fee payment proof",
      module: "Payments",
      stageId: "documentation",
      priority: "Medium",
      status: "Open",
      assignee: "Meera",
      dueDate: iso(addDays(5)),
      createdAt: iso(addDays(-1)),
      tags: ["Payment", "Proof"],
    },
    {
      id: "wf-1007",
      refNo: "APP-24033",
      title: "Background check: Security Guard",
      module: "Recruitment",
      stageId: "screening",
      priority: "Low",
      status: "Open",
      assignee: "Asha",
      dueDate: iso(addDays(6)),
      createdAt: iso(addDays(-2)),
      tags: ["BGC", "Guard"],
    },
    {
      id: "wf-1008",
      refNo: "DOC-3002",
      title: "Upload signed contract & visa copy",
      module: "Documentation",
      stageId: "documentation",
      priority: "High",
      status: "Open",
      assignee: "Rahul",
      dueDate: iso(addDays(2)),
      createdAt: iso(addDays(-7)),
      tags: ["Contract", "Visa"],
    },
    {
      id: "wf-1009",
      refNo: "DEP-5501",
      title: "Issue deployment letter",
      module: "Deployment",
      stageId: "done",
      priority: "Medium",
      status: "Open",
      assignee: "Meera",
      dueDate: iso(addDays(-10)),
      createdAt: iso(addDays(-12)),
      tags: ["Letter"],
    },
    {
      id: "wf-1010",
      refNo: "PAY-9010",
      title: "Reconcile vendor invoice (Medicals)",
      module: "Payments",
      stageId: "inbox",
      priority: "Medium",
      status: "Open",
      assignee: "Rahul",
      dueDate: iso(addDays(4)),
      createdAt: iso(addDays(-1)),
      tags: ["Invoice", "Medical"],
    },
    {
      id: "wf-1011",
      refNo: "CAN-11912",
      title: "Collect missing photos (white background)",
      module: "Documentation",
      stageId: "documentation",
      priority: "Low",
      status: "Open",
      assignee: "Asha",
      dueDate: iso(addDays(7)),
      createdAt: iso(addDays(-3)),
      tags: ["Photo"],
    },
    {
      id: "wf-1012",
      refNo: "APP-24035",
      title: "First call & basic screening",
      module: "Recruitment",
      stageId: "screening",
      priority: "Medium",
      status: "Open",
      assignee: "Meera",
      dueDate: iso(addDays(1)),
      createdAt: iso(addDays(-1)),
      tags: ["Call"],
    },
  ];
}

export function getStageIndex(stageId: WorkflowStageId) {
  return workflowStages.findIndex((s) => s.id === stageId);
}

export function canMoveStage(stageId: WorkflowStageId, direction: "prev" | "next") {
  const idx = getStageIndex(stageId);
  if (idx < 0) return false;
  if (direction === "prev") return idx > 0;
  return idx < workflowStages.length - 1;
}

export function moveItemStage(
  items: WorkflowItem[],
  itemId: string,
  direction: "prev" | "next",
): WorkflowItem[] {
  return items.map((it) => {
    if (it.id !== itemId) return it;
    const idx = getStageIndex(it.stageId);
    if (idx < 0) return it;
    const nextIdx = direction === "prev" ? idx - 1 : idx + 1;
    const nextStage = workflowStages[nextIdx]?.id;
    if (!nextStage) return it;
    return { ...it, stageId: nextStage };
  });
}

