export interface Tab {
  id: string
  name: string
  color: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateTabDto {
  name: string
  color?: string
}

export interface UpdateTabDto {
  name?: string
  color?: string
}
