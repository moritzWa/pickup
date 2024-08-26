import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Content } from "../Content/Content";

@Entity({
    name: "authors",
})
export class Author {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        name: "name",
        type: "text",
    })
    name!: string;

    @Column({
        nullable: true,
        name: "image_url",
        type: "text",
    })
    imageUrl!: string | null;

    @ManyToMany(() => Content, (content) => content.authors, {
        cascade: false,
        eager: false,
    })
    @JoinTable({
        name: "content_authors",
        joinColumn: { name: "author_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "content_id", referencedColumnName: "id" },
    })
    // Note: Cascade delete for content is handled at the database level in the content_authors junction table.
    // See migration: UpdateContentAuthorFK1723675580018
    contents!: Content[];

    @CreateDateColumn({
        name: "created_at",
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    createdAt!: Date;

    @CreateDateColumn({
        name: "updated_at",
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    updatedAt!: Date;
}
