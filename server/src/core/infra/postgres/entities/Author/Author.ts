import {
    Column,
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

    @ManyToMany(() => Content, (content) => content.authors)
    @JoinTable({
        name: "content_authors",
        joinColumn: { name: "author_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "content_id", referencedColumnName: "id" },
    })
    contents!: Content[];
}
