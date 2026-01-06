export interface Group {
  id: string
  name: string
  color: string
  tabId: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateGroupDto {
  name: string
  color: string
  tabId: string
}

export interface UpdateGroupDto {
  name?: string
  color?: string
  tabId?: string
}

