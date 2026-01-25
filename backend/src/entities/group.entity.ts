import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tab } from './tab.entity';
import { BookmarkGroup } from './bookmark-group.entity';

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

  @OneToMany(() => BookmarkGroup, (bookmarkGroup) => bookmarkGroup.group, {
    cascade: true,
  })
  bookmarkGroups: BookmarkGroup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
