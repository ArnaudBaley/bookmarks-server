import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { Tab } from './tab.entity';
import { BookmarkGroup } from './bookmark-group.entity';

@Entity('bookmarks')
export class Bookmark {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text')
  url: string;

  @Column('varchar', { length: 36, nullable: true })
  tabId: string | null; // Keep for backward compatibility

  @ManyToOne(() => Tab, { nullable: true })
  @JoinColumn({ name: 'tabId' })
  tab: Tab;

  @ManyToMany(() => Tab)
  @JoinTable({
    name: 'bookmark_tabs',
    joinColumn: { name: 'bookmark_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tab_id', referencedColumnName: 'id' },
  })
  tabs: Tab[];

  @OneToMany(() => BookmarkGroup, (bookmarkGroup) => bookmarkGroup.bookmark, {
    cascade: true,
  })
  bookmarkGroups: BookmarkGroup[];

  // Virtual property for backward compatibility - returns groups from bookmarkGroups
  get groups(): Group[] {
    if (!this.bookmarkGroups) return [];
    return this.bookmarkGroups
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((bg) => bg.group)
      .filter((g) => g !== undefined);
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
