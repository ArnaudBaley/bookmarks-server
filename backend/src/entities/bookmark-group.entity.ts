import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Bookmark } from './bookmark.entity';
import { Group } from './group.entity';

@Entity('bookmark_groups')
export class BookmarkGroup {
  @PrimaryColumn('varchar', { length: 36, name: 'bookmark_id' })
  bookmarkId: string;

  @PrimaryColumn('varchar', { length: 36, name: 'group_id' })
  groupId: string;

  @Column('integer', { default: 0 })
  orderIndex: number;

  @ManyToOne(() => Bookmark, (bookmark) => bookmark.bookmarkGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookmark_id' })
  bookmark: Bookmark;

  @ManyToOne(() => Group, (group) => group.bookmarkGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: Group;
}
