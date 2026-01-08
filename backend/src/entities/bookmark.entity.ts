import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { Tab } from './tab.entity';

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

  @ManyToMany(() => Group, (group) => group.bookmarks)
  @JoinTable({
    name: 'bookmark_groups',
    joinColumn: { name: 'bookmark_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'group_id', referencedColumnName: 'id' },
  })
  groups: Group[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
