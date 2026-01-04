export interface Group {
  id: string
  name: string
  color: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateGroupDto {
  name: string
  color: string
}

export interface UpdateGroupDto {
  name: string
  color: string
}

