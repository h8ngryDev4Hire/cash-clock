export type TaskId = string
export type TimeEntryId = string
export type ProjectId = string

export type ItemId = TaskId | TimeEntryId | ProjectId 

export interface BaseItem {
	created: number
	lastUpdated: number
	itemId: ItemId 
}

export interface TaskSchema extends BaseItem {
	isRunning: boolean
	isGrouped: boolean
	isCompleted: boolean
	projectId: ProjectId | null
	name: string
	timeEntries: TimeEntrySchema[]
	getTotalTimeSpent: () => number
}

export interface TimeEntrySchema extends BaseItem {
	taskId: TaskId
	isRunning: boolean
	timeSpent: number
	timeStarted: number
	timeEnded: number | null
}

export interface ProjectSchema extends BaseItem {
	name: string
}
