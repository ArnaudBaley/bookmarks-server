import type { Tab, CreateTabDto, UpdateTabDto } from '@/types/tab'

/**
 * Interface for tab API communication
 * This interface defines the contract for all tab API implementations
 */
export interface ITabApi {
  /**
   * Fetch all tabs
   * @returns Promise resolving to an array of tabs
   */
  getAllTabs(): Promise<Tab[]>

  /**
   * Get a tab by ID
   * @param id - The ID of the tab to fetch
   * @returns Promise resolving to the tab
   */
  getTabById(id: string): Promise<Tab>

  /**
   * Create a new tab
   * @param data - The tab data to create
   * @returns Promise resolving to the created tab
   */
  createTab(data: CreateTabDto): Promise<Tab>

  /**
   * Update an existing tab
   * @param id - The ID of the tab to update
   * @param data - The tab data to update
   * @returns Promise resolving to the updated tab
   */
  updateTab(id: string, data: UpdateTabDto): Promise<Tab>

  /**
   * Delete a tab by ID
   * @param id - The ID of the tab to delete
   * @returns Promise that resolves when the tab is deleted
   */
  deleteTab(id: string): Promise<void>
}
