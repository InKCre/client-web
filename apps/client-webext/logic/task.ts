import { useWebExtensionStorage } from "~/composables/useWebExtensionStorage";

export interface Task {
  id: string;
  createdAt: Date;
  sender: {
    tabId?: number;
  };
  state: "pending" | "handling" | "completed" | "failed";
  type: string;
  parameters: Record<string, any>;
  save: () => void;
  markAsCompleted: () => void;
  markAsFailed: () => void;
}

export const { data: tasks, dataReady: tasksReady } = useWebExtensionStorage(
  "tasks",
  [] as Task[],
);

type newTaskOptions = { type: string; parameters: Record<string, any>, from?: 'sidepanel' };
export function newTask({ type, parameters, from }: newTaskOptions): Promise<Task> {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage({ type: "get-tab-id", from }, (response) => {
      const task: Task = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        sender: {
          tabId: response.tabId,
        },
        state: "pending",
        type,
        parameters,
        save() {
          const me = tasks.value.find((task) => task.id === this.id);
          if (!me) throw new Error(`Task ${this.id} not exist`);
          Object.assign(me, this);
        },
        markAsCompleted() {
          this.state = "completed";
        },
        markAsFailed() {
          this.state = "failed";
        },
      };

      tasks.value.push(task);

      resolve(task);
    });
  });
}

export function popPendingTask(type: string, keep: boolean = false): Task | undefined {
  // Find the newest pending task of the given type
  const pendingTasksOfType = tasks.value.filter(
    (task) => task.state === "pending" && task.type === type,
  );
  tasks.value.forEach((task) => {
    task.createdAt = new Date(task.createdAt);
  });

  if (pendingTasksOfType.length === 0) {
    return undefined;
  }

  // Sort by createdAt to get the newest
  pendingTasksOfType.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const oldestTask = pendingTasksOfType[0];

  // Mark as handling
  if (!keep) {
    oldestTask.state = "handling";
  }

  return oldestTask;
}

/**
 * 
 * @param type 
 * @param callback 
 * @param immediate 
 * @param keep Pop but keep task state as is
 */
export function onNewTask(
  type: string,
  callback: (task: Task) => void,
  immediate: boolean = true,
  keep: boolean = false,
) {
  watch(
    tasks,
    () => {
      const newTask = popPendingTask(type, keep);
      if (newTask) {
        callback(newTask);
      }
    },
    { immediate },
  );
}
