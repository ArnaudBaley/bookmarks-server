import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bookmark } from './bookmark.entity';
import { Tab } from './tab.entity';

@Entity('groups')
export class Group {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 50 })
  color: string;

  @Column('varchar', { length: 36, nullable: true })
  tabId: string | null;

  @Column('integer', { default: 0 })
  orderIndex: number;

  @ManyToOne(() => Tab)
  @JoinColumn({ name: 'tabId' })
  tab: Tab;

  @ManyToMany(() => Bookmark, (bookmark) => bookmark.groups)
  bookmarks: Bookmark[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
